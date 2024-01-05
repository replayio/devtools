/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { AnyAction, PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { FrameId, Location, PauseId, Value } from "@replayio/protocol";

import { FindTargetCommand } from "replay-next/src/suspense/ResumeTargetCache";
import { SourceDetails } from "ui/reducers/sources";
import { getContextFromAction } from "ui/setup/redux/middleware/context";
import type { UIState } from "ui/state";

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

export type SeekState = "step" | "find-point" | "create-pause" | "paused";

export interface PauseState {
  cx: { navigateCounter: number };
  seekLock: any;
  seekState: SeekState;
  id: string | undefined;
  threadcx: ThreadContext;
  pausePreviewLocation: Location | null;
  selectedFrameId: PauseAndFrameId | null;
  executionPoint: string | null;
  time: number;
  pauseHistory: PauseHistoryData[];
  pauseHistoryIndex: number;
  queuedCommands: FindTargetCommand[];
}

const resumedPauseState = {
  seekState: "find-point" as SeekState,
  id: undefined,
  pausePreviewLocation: null,
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
  seekLock: null,
  time: 0,
  ...resumedPauseState,
  pauseHistory: [],
  pauseHistoryIndex: -1,
  queuedCommands: [],
};

const pauseSlice = createSlice({
  name: "pause",
  initialState,
  reducers: {
    pauseRequestedAt(
      state,
      action: PayloadAction<{
        executionPoint?: string;
        time: number;
        location?: Location;
        seekLock: any;
      }>
    ) {
      const { seekLock, executionPoint, location, time } = action.payload;
      Object.assign(state, {
        seekLock,
        seekState: executionPoint ? "create-pause" : "find-point",
        id: undefined,
        executionPoint: executionPoint ?? null,
        time,
        pausePreviewLocation: location ?? null,
      } satisfies Partial<PauseState>);
      state.threadcx.isPaused = true;
    },
    paused(
      state,
      action: PayloadAction<{
        id: string;
        executionPoint: string;
        time: number;
      }>
    ) {
      const { id, executionPoint, time } = action.payload;
      Object.assign(state, {
        seekState: "paused",
        id,
        executionPoint,
        time,
      } satisfies Partial<PauseState>);

      state.selectedFrameId = null;
      state.threadcx.pauseCounter++;
      if (state.pauseHistory[state.pauseHistoryIndex]?.executionPoint !== executionPoint) {
        state.pauseHistory = state.pauseHistory.slice(0, state.pauseHistoryIndex + 1);
        state.pauseHistory.push({
          pauseId: id,
          time,
          executionPoint,
          hasFrames: false,
        });
        state.pauseHistoryIndex++;
      }
    },
    clearSeekLock(state) {
      state.seekLock = null;
    },
    pauseHistoryDecremented(state) {
      state.pauseHistoryIndex--;
    },
    pauseHistoryIncremented(state) {
      state.pauseHistoryIndex++;
    },
    pauseCreationFailed(state) {
      const lastPause = state.pauseHistory[state.pauseHistoryIndex];
      Object.assign(state, {
        seekLock: null,
        seekState: "paused",
        id: lastPause?.pauseId,
        executionPoint: lastPause?.executionPoint ?? null,
        time: lastPause?.time ?? 0,
        pausePreviewLocation: null,
        selectedFrameId: null,
      } satisfies Partial<PauseState>);

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
    stepping(state, action: PayloadAction<any>) {
      Object.assign(state, {
        ...resumedPauseState,
        seekState: "step",
        seekLock: action.payload,
      } satisfies Partial<PauseState>);
      state.threadcx.isPaused = false;
    },
    enqueueCommand(state, action: PayloadAction<FindTargetCommand>) {
      state.queuedCommands.push(action.payload);
    },
    dequeueCommand(state) {
      state.queuedCommands.shift();
    },
  },
});

export const {
  clearSeekLock,
  frameSelected,
  pauseCreationFailed,
  pauseRequestedAt,
  paused,
  previewLocationCleared,
  previewLocationUpdated,
  resumed,
  pauseHistoryDecremented,
  pauseHistoryIncremented,
  stepping,
  enqueueCommand,
  dequeueCommand,
} = pauseSlice.actions;

// Selectors

export function getContext(state: UIState) {
  return state.pause.cx;
}

export function getThreadContext(state: UIState) {
  return state.pause.threadcx;
}

export function getSeekLock(state: UIState) {
  return state.pause.seekLock;
}

export function getSeekState(state: UIState) {
  return state.pause.seekState;
}

export function getSelectedFrameId(state: UIState) {
  return state.pause.selectedFrameId;
}

export function getExecutionPoint(state: UIState) {
  return state.pause.executionPoint;
}

export function getTime(state: UIState) {
  return state.pause.time;
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

export function getNextQueuedCommand(state: UIState) {
  return state.pause.queuedCommands[0];
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
