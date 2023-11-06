/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { AnyAction, PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { FrameId, Location, PauseId, Value } from "@replayio/protocol";

import { ThreadFront } from "protocol/thread";
import { FindTargetCommand, resumeTargetCache } from "replay-next/src/suspense/ResumeTargetCache";
import { isPointInRegion } from "shared/utils/time";
import { SourceDetails, getPreferredLocation, getSelectedSourceId } from "ui/reducers/sources";
import { getContextFromAction } from "ui/setup/redux/middleware/context";
import type { UIState } from "ui/state";
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
  { cx: Context; command: FindTargetCommand },
  { state: UIState; extra: ThunkExtraArgs }
>("pause/executeCommand", async ({ command }, thunkApi) => {
  const { extra, getState } = thunkApi;
  const { replayClient } = extra;
  const state = getState();
  const focusWindow = replayClient.getCurrentFocusWindow();
  const point = getExecutionPoint(state);
  const selectedFrameId = getSelectedFrameId(state);
  const sourceId = getSelectedSourceId(state);
  if (!point || !focusWindow) {
    return { location: null };
  }

  ThreadFront.emit("resumed");

  const resumeTarget = await resumeTargetCache.readAsync(
    replayClient,
    command,
    point,
    selectedFrameId,
    sourceId
  );

  if (resumeTarget && isPointInRegion(resumeTarget.point, focusWindow)) {
    const { point, time, frame } = resumeTarget;
    ThreadFront.timeWarp(point, time, !!frame);
  } else {
    ThreadFront.emit("paused", {
      point: ThreadFront.currentPoint,
      time: ThreadFront.currentTime,
      openSource: true,
    });
  }

  if (!resumeTarget?.frame) {
    return { location: null };
  }

  const location = getPreferredLocation(state.sources, resumeTarget.frame);

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
