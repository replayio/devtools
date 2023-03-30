/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { AnyAction, PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  FrameId,
  Location,
  PauseId,
  SourceLocation,
  TimeStampedPoint,
  Value,
} from "@replayio/protocol";
import findLast from "lodash/findLast";

import { compareNumericStrings } from "protocol/utils";
import { framesCache } from "replay-next/src/suspense/FrameCache";
import { frameStepsCache } from "replay-next/src/suspense/FrameStepsCache";
import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import { ReplayClientInterface } from "shared/client/types";
import { getPreferredLocation, getSelectedSourceId } from "ui/reducers/sources";
import { SourceDetails } from "ui/reducers/sources";
import { getContextFromAction } from "ui/setup/redux/middleware/context";
import type { UIState } from "ui/state";
import { features } from "ui/utils/prefs";
import { ThunkExtraArgs } from "ui/utils/thunk";

export interface Context {
  navigateCounter: number;
}

interface PauseHistoryData {
  pauseId: string;
  time: number;
  executionPoint: string;
  hasFrames: boolean;
}

export interface ThreadContext {
  isPaused: boolean;
  navigateCounter: number;
  pauseCounter: number;
}

export interface PauseFrame {
  id: string;
  pauseId: PauseId;
  protocolId: string;
  index: number;
  displayName: string;
  location: Location;
  alternateLocation?: Location;
  this: Value;
  source: SourceDetails | null;
  // Possibly added later client-side
  library?: string;
}

// TBD
type UnknownPosition = TimeStampedPoint & { location: Location };

export interface PauseAndFrameId {
  pauseId: PauseId;
  frameId: FrameId;
}

export interface PauseState {
  cx: { navigateCounter: number };
  id: string | undefined;
  threadcx: ThreadContext;
  pauseErrored: boolean;
  pauseLoading: boolean;
  pausePreviewLocation: Location | null;
  selectedFrameId: PauseAndFrameId | null;
  executionPoint: string | null;
  command: string | null;
  replayFramePositions?: { positions: UnknownPosition[] } | null;
  pauseHistory: PauseHistoryData[];
  pauseHistoryIndex: number;
}

export type ValidCommand =
  | "stepIn"
  | "stepOut"
  | "stepOver"
  | "resume"
  | "rewind"
  | "reverseStepOver";

const resumedPauseState = {
  frames: null,
  framesLoading: false,
  framesErrored: false,
  frameScopes: {},
  selectedFrameId: null,
  executionPoint: null,
  why: null,
};

const initialState: PauseState = {
  pauseErrored: false,
  pauseLoading: false,
  cx: {
    navigateCounter: 0,
  },
  threadcx: {
    navigateCounter: 0,
    isPaused: false,
    pauseCounter: 0,
  },
  id: undefined,
  pausePreviewLocation: null,
  ...resumedPauseState,
  command: null,
  pauseHistory: [],
  pauseHistoryIndex: -1,
};

export const executeCommandOperation = createAsyncThunk<
  { location: Location | null },
  { cx: Context; command: ValidCommand },
  { state: UIState; extra: ThunkExtraArgs }
>("pause/executeCommand", async ({ cx, command }, thunkApi) => {
  const { extra, getState } = thunkApi;
  const { ThreadFront, replayClient } = extra;
  const state = getState();
  const loadedRegions = getLoadedRegions(state)!;
  const sourceId = getSelectedSourceId(state);
  const symbols = sourceId ? await sourceOutlineCache.readAsync(replayClient, sourceId) : undefined;
  const nextPoint = await getResumePoint(replayClient, state, command);

  const resp = await ThreadFront[command]({
    point: nextPoint,
    sourceId,
    loadedRegions,
    locationsToSkip:
      // skip over points that are mapped to the beginning of a function body
      // see SCS-172
      features.brokenSourcemapWorkaround &&
      (command === "stepOver" || command === "reverseStepOver")
        ? (symbols?.functions.map(f => f.body).filter(Boolean) as SourceLocation[])
        : undefined,
  });
  if (!resp?.frame) {
    return { location: null };
  }

  const location = getPreferredLocation(state.sources, resp.frame);

  return { location };
});

const pauseSlice = createSlice({
  name: "pause",
  initialState,
  reducers: {
    pauseRequestedAt(state) {
      Object.assign(state, {
        pauseErrored: false,
        pauseLoading: true,
        framesLoading: true,
        framesErrored: false,
      });

      state.threadcx.isPaused = true;
    },
    paused(
      state,
      action: PayloadAction<{
        id: string;
        frame?: PauseFrame;
        why?: string;
        executionPoint: string;
        // used by the legacy Messages reducer
        time?: number;
      }>
    ) {
      const { id, frame, why, executionPoint, time } = action.payload;
      Object.assign(state, {
        pauseErrored: false,
        pauseLoading: false,
        id,
        frameScopes: resumedPauseState.frameScopes,
        why,
        executionPoint,
      });

      state.selectedFrameId = frame ? { pauseId: frame.pauseId, frameId: frame.protocolId } : null;
      state.threadcx.pauseCounter++;
      state.pausePreviewLocation = null;
      if (time) {
        const filteredPauses = state.pauseHistory.filter(pause => pause.time === time);
        if (!filteredPauses.length) {
          state.pauseHistory.push({
            pauseId: id,
            time,
            executionPoint,
            hasFrames: !!frame,
          });
          state.pauseHistoryIndex++;
        }
      }
    },
    pauseHistoryDecremented(state) {
      state.pauseHistoryIndex--;
    },
    pauseHistoryIncremented(state) {
      state.pauseHistoryIndex++;
    },
    pauseCreationFailed(state, action: PayloadAction<string>) {
      const executionPoint = action.payload;
      Object.assign(state, {
        pauseErrored: true,
        pauseLoading: false,
        id: undefined,
        selectedFrameId: undefined,
        frames: undefined,
        frameScopes: {},
        executionPoint,
      });

      state.threadcx.pauseCounter++;
      state.threadcx.isPaused = false;
    },
    previewLocationUpdated(state, action: PayloadAction<Location>) {
      state.pausePreviewLocation = action.payload;
    },
    previewLocationCleared(state) {
      state.pausePreviewLocation = null;
    },
    framePositionsLoaded(state, action: PayloadAction<UnknownPosition[]>) {
      state.replayFramePositions = { positions: action.payload };
    },
    framePositionsCleared(state) {
      state.replayFramePositions = null;
    },
    frameSelected(
      state,
      action: PayloadAction<{ cx: Context; pauseId: PauseId; frameId: FrameId }>
    ) {
      state.selectedFrameId = { pauseId: action.payload.pauseId, frameId: action.payload.frameId };
    },
    resumed(state) {
      Object.assign(state, resumedPauseState);
      if (state.pauseHistoryIndex !== state.pauseHistory.length - 1) {
        while (state.pauseHistoryIndex !== state.pauseHistory.length - 1) {
          state.pauseHistory.pop();
        }
      }
      state.threadcx.isPaused = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(executeCommandOperation.pending, (state, action) => {
        const { command } = action.meta.arg;
        state.command = command;
        state.threadcx.pauseCounter++;
        state.threadcx.isPaused = false;

        if (command == "resume" || command == "rewind") {
          // TODO This logic seems at odds with the existing
          // "fetch if no positions" in the `command` thunk
          // also clear out positions
          state.replayFramePositions = null;
        }
      })
      .addCase(executeCommandOperation.fulfilled, (state, action) => {
        state.command = null;
        state.pausePreviewLocation = action.payload.location;
      })
      .addCase(executeCommandOperation.rejected, (state, action) => {
        state.command = null;
      });
  },
});

export const {
  framePositionsCleared,
  framePositionsLoaded,
  frameSelected,
  pauseCreationFailed,
  pauseRequestedAt,
  paused,
  previewLocationCleared,
  previewLocationUpdated,
  resumed,
  pauseHistoryDecremented,
  pauseHistoryIncremented,
} = pauseSlice.actions;

// Copied to avoid import
const getLoadedRegions = (state: UIState) => state.app.loadedRegions;

// Selectors

export function getContext(state: UIState) {
  return state.pause.cx;
}

export function getThreadContext(state: UIState) {
  return state.pause.threadcx;
}

export function getPauseCommand(state: UIState) {
  return state.pause.command;
}

export function isStepping(state: UIState) {
  return ["stepIn", "stepOver", "stepOut"].includes(getPauseCommand(state)!);
}

export function isEvaluatingExpression(state: UIState) {
  return state.pause.command === "expression";
}

export function getSelectedFrameId(state: UIState) {
  return state.pause.selectedFrameId;
}

export function getExecutionPoint(state: UIState) {
  return state.pause.executionPoint;
}

export function getPauseId(state: UIState) {
  return state.pause.id;
}

export function getPauseErrored(state: UIState) {
  return state.pause.pauseErrored;
}

export function getPausePreviewLocation(state: UIState) {
  return state.pause.pausePreviewLocation;
}
export function getPauseHistory(state: UIState) {
  return state.pause.pauseHistory;
}
export function getPauseHistoryIndex(state: UIState) {
  return state.pause.pauseHistoryIndex;
}

async function getResumePoint(replayClient: ReplayClientInterface, state: UIState, type: string) {
  const executionPoint = getExecutionPoint(state);
  const selectedFrameId = getSelectedFrameId(state);
  if (!executionPoint || !selectedFrameId) {
    return;
  }
  const frames = await framesCache.readAsync(replayClient, selectedFrameId.pauseId);
  const frame = frames?.find(frame => frame.frameId === selectedFrameId.frameId);
  if (!frames || !frame || frame === frames[0]) {
    return;
  }
  const frameSteps = await frameStepsCache.readAsync(
    replayClient,
    selectedFrameId.pauseId,
    selectedFrameId.frameId
  );
  if (!frameSteps?.length) {
    return;
  }

  if (type == "reverseStepOver" || type == "rewind") {
    return findLast(frameSteps, p => compareNumericStrings(p.point, executionPoint) < 0)?.point;
  }

  if (type == "stepOver" || type == "resume" || type == "stepIn" || type == "stepOut") {
    let index = frameSteps.findIndex(p => compareNumericStrings(p.point, executionPoint) > 0);
    if (index < 0) {
      index = frameSteps.length - 1;
    }
    return frameSteps[index].point;
  }
}

const pauseWrapperReducer = (state: PauseState, action: AnyAction) => {
  const cx = getContextFromAction(action);
  // Ignore actions if the pause counter is different, which indicates
  // that the user did something else before a response returned
  if (cx && cx.pauseCounter !== state.threadcx.pauseCounter) {
    return state;
  }
  return pauseSlice.reducer(state, action);
};

export default pauseWrapperReducer;
