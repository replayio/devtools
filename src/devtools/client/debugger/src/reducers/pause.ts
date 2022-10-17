/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { createSlice, createAsyncThunk, PayloadAction, AnyAction } from "@reduxjs/toolkit";
import type { Location, TimeStampedPoint, Value, PauseId } from "@replayio/protocol";
import type { UIState } from "ui/state";
import { getPreferredLocation } from "ui/reducers/sources";

import findLast from "lodash/findLast";
import { compareNumericStrings } from "protocol/utils";
import { SourceDetails } from "ui/reducers/sources";

import { ThunkExtraArgs } from "ui/utils/thunk";
import { getContextFromAction } from "ui/setup/redux/middleware/context";
import { getFrameStepsAsync } from "ui/suspense/frameStepsCache";
import { getAllCachedPauseFrames } from "../utils/frames";

export interface Context {
  navigateCounter: number;
}

export interface ThreadContext {
  isPaused: boolean;
  navigateCounter: number;
  pauseCounter: number;
}

export interface PauseFrame {
  id: string;
  protocolId: string;
  asyncIndex: number;
  displayName: string;
  location: Location;
  alternateLocation?: Location;
  this: Value;
  source: SourceDetails | null;
  index: number;
  asyncCause?: "async";
  state: "on-stack";
  pauseId: PauseId;
  // Possibly added later client-side
  library?: string;
}

// TBD
type UnknownPosition = TimeStampedPoint & { location: Location };

export interface PauseState {
  cx: { navigateCounter: number };
  id: string | undefined;
  threadcx: ThreadContext;
  pauseErrored: boolean;
  pauseLoading: boolean;
  pausePreviewLocation: Location | null;
  selectedFrameId: string | null;
  executionPoint: string | null;
  why: string | null;
  command: string | null;
  replayFramePositions?: { positions: UnknownPosition[] } | null;
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
};

export const executeCommandOperation = createAsyncThunk<
  { location: Location | null },
  { cx: Context; command: ValidCommand },
  { state: UIState; extra: ThunkExtraArgs }
>("pause/executeCommand", async ({ cx, command }, thunkApi) => {
  const { extra, getState } = thunkApi;
  const { ThreadFront } = extra;
  const state = getState();
  const loadedRegions = getLoadedRegions(state)!;
  const nextPoint = await getResumePoint(state, command);

  const resp = await ThreadFront[command](nextPoint, loadedRegions);
  if (!resp?.frame) {
    return { location: null };
  }

  const location = getPreferredLocation(
    state.sources,
    resp.frame,
    ThreadFront.preferredGeneratedSources
  );

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
      const { id, frame, why, executionPoint } = action.payload;
      Object.assign(state, {
        pauseErrored: false,
        pauseLoading: false,
        id,
        frameScopes: resumedPauseState.frameScopes,
        why,
        executionPoint,
      });

      state.selectedFrameId = frame ? frame.id : null;
      state.threadcx.pauseCounter++;
      state.pausePreviewLocation = null;
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
    frameSelected(state, action: PayloadAction<{ cx: Context; frameId: string }>) {
      state.selectedFrameId = action.payload.frameId;
    },
    resumed(state) {
      Object.assign(state, resumedPauseState);
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

export function getPauseReason(state: UIState) {
  return state.pause.why;
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

export function getPausePreviewLocation(state: UIState) {
  return state.pause.pausePreviewLocation;
}

async function getResumePoint(state: UIState, type: string) {
  const executionPoint = getExecutionPoint(state);
  const pauseId = getPauseId(state);
  const frameId = getSelectedFrameId(state);
  if (!executionPoint || !pauseId || !frameId) {
    return;
  }
  const frames = getAllCachedPauseFrames(pauseId, state.sources);
  const frame = frames?.find(frame => frame.id === frameId);
  if (!frames || !frame || frame === frames[0]) {
    return;
  }
  const frameSteps = await getFrameStepsAsync(frame.pauseId, frame.protocolId);
  if (!frameSteps) {
    return;
  }
  if (type == "reverseStepOver" || type == "rewind") {
    return findLast(frameSteps, p => compareNumericStrings(p.point, executionPoint) < 0)?.point;
  }

  if (type == "stepOver" || type == "resume" || type == "stepIn" || type == "stepUp") {
    return frameSteps.find(p => compareNumericStrings(p.point, executionPoint) > 0)?.point;
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
