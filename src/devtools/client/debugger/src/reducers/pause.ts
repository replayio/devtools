/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { AnyAction, PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { FrameId, Location, PauseId, SourceLocation, Value } from "@replayio/protocol";

import { framesCache } from "replay-next/src/suspense/FrameCache";
import { pointStackCache } from "replay-next/src/suspense/PointStackCache";
import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import { ReplayClientInterface } from "shared/client/types";
import { SourceDetails, getPreferredLocation, getSelectedSourceId } from "ui/reducers/sources";
import { getContextFromAction } from "ui/setup/redux/middleware/context";
import type { UIState } from "ui/state";
import { resumeOperations } from "ui/utils/resumeOperations";
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

export interface PauseAndFrameId {
  pauseId: PauseId;
  frameId: FrameId;
}

export interface PauseState {
  cx: { navigateCounter: number };
  id: string | undefined;
  threadcx: ThreadContext;
  pausePreviewLocation: Location | null;
  selectedFrameId: PauseAndFrameId | null;
  executionPoint: string | null;
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
  selectedFrameId: null,
  executionPoint: null,
};

const initialState: PauseState = {
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
  pauseHistory: [],
  pauseHistoryIndex: -1,
};

export const executeCommandOperation = createAsyncThunk<
  { location: Location | null },
  { cx: Context; command: ValidCommand },
  { state: UIState; extra: ThunkExtraArgs }
>("pause/executeCommand", async ({ cx, command }, thunkApi) => {
  const { extra, getState } = thunkApi;
  const { replayClient } = extra;
  const state = getState();
  const focusWindow = replayClient.getCurrentFocusWindow();
  const sourceId = getSelectedSourceId(state);
  const symbols = sourceId ? await sourceOutlineCache.readAsync(replayClient, sourceId) : undefined;
  const nextPoint = await getResumePoint(replayClient, state);

  const resp = await resumeOperations[command](replayClient, {
    point: nextPoint,
    sourceId,
    focusWindow,
    locationsToSkip:
      // skip over points that are mapped to the beginning of a function body
      // see SCS-172
      command === "stepOver" || command === "reverseStepOver"
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
      state.threadcx.isPaused = true;
    },
    paused(
      state,
      action: PayloadAction<{
        id: string;
        frame?: PauseFrame;
        executionPoint: string;
        time: number;
      }>
    ) {
      const { id, frame, executionPoint, time } = action.payload;
      Object.assign(state, {
        id,
        executionPoint,
      });

      state.selectedFrameId = frame ? { pauseId: frame.pauseId, frameId: frame.protocolId } : null;
      state.threadcx.pauseCounter++;
      state.pausePreviewLocation = null;
      if (state.pauseHistory[state.pauseHistoryIndex]?.executionPoint !== executionPoint) {
        state.pauseHistory = state.pauseHistory.slice(0, state.pauseHistoryIndex + 1);
        state.pauseHistory.push({
          pauseId: id,
          time,
          executionPoint,
          hasFrames: !!frame,
        });
        state.pauseHistoryIndex++;
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
        id: undefined,
        selectedFrameId: undefined,
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
    frameSelected(
      state,
      action: PayloadAction<{ cx: Context; pauseId: PauseId; frameId: FrameId }>
    ) {
      state.selectedFrameId = { pauseId: action.payload.pauseId, frameId: action.payload.frameId };
    },
    resumed(state) {
      Object.assign(state, resumedPauseState);
      state.threadcx.isPaused = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(executeCommandOperation.pending, (state, action) => {
        state.threadcx.pauseCounter++;
        state.threadcx.isPaused = false;
      })
      .addCase(executeCommandOperation.fulfilled, (state, action) => {
        state.pausePreviewLocation = action.payload.location;
      });
  },
});

export const {
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

// Selectors

export function getContext(state: UIState) {
  return state.pause.cx;
}

export function getThreadContext(state: UIState) {
  return state.pause.threadcx;
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
export function getPauseHistory(state: UIState) {
  return state.pause.pauseHistory;
}
export function getPauseHistoryIndex(state: UIState) {
  return state.pause.pauseHistoryIndex;
}

async function getResumePoint(replayClient: ReplayClientInterface, state: UIState) {
  const executionPoint = getExecutionPoint(state);
  const selectedFrameId = getSelectedFrameId(state);
  if (!executionPoint || !selectedFrameId) {
    return;
  }
  const frames = await framesCache.readAsync(replayClient, selectedFrameId.pauseId);
  const frameIndex = frames?.findIndex(frame => frame.frameId === selectedFrameId.frameId);
  if (!frames || !frameIndex) {
    return;
  }

  const pointStack = await pointStackCache.readAsync(0, frameIndex, replayClient, executionPoint);

  return pointStack[frameIndex].point.point;
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
