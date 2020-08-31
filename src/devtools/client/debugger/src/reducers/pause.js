/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// 
/* eslint complexity: ["error", 35]*/

/**
 * Pause reducer
 * @module reducers/pause
 */

import { prefs } from "../utils/prefs";
import { getSelectedSourceId } from "./sources";
import { getSelectedFrame, getFramePositions } from "../selectors/pause";
import { findLast, find } from "lodash";



// Pause state associated with an individual thread.

// Pause state describing all threads.

function createPauseState(thread = "UnknownThread") {
  return {
    cx: {
      navigateCounter: 0,
    },
    threadcx: {
      navigateCounter: 0,
      thread,
      isPaused: false,
      pauseCounter: 0,
    },
    previewLocation: null,
    highlightedCalls: null,
    threads: {},
    skipPausing: prefs.skipPausing,
    shouldLogExceptions: prefs.logExceptions,
  };
}

const resumedPauseState = {
  frames: null,
  framesLoading: false,
  frameScopes: {},
  selectedFrameId: null,
  executionPoint: null,
  why: null,
  inlinePreview: {},
  highlightedCalls: null,
};

const createInitialPauseState = () => ({
  ...resumedPauseState,
  isWaitingOnBreak: false,
  command: null,
  lastCommand: null,
  previousLocation: null,
  expandedScopes: new Set(),
  lastExpandedScopes: [],
});

function getThreadPauseState(state, thread) {
  // Thread state is lazily initialized so that we don't have to keep track of
  // the current set of worker threads.
  return state.threads[thread] || createInitialPauseState();
}

function update(state = createPauseState(), action) {
  // Actions need to specify any thread they are operating on. These helpers
  // manage updating the pause state for that thread.
  const threadState = () => {
    if (!action.thread) {
      throw new Error(`Missing thread in action ${action.type}`);
    }
    return getThreadPauseState(state, action.thread);
  };

  const updateThreadState = newThreadState => {
    if (!action.thread) {
      throw new Error(`Missing thread in action ${action.type}`);
    }
    return {
      ...state,
      threads: {
        ...state.threads,
        [action.thread]: { ...threadState(), ...newThreadState },
      },
    };
  };

  switch (action.type) {
    case "SELECT_THREAD": {
      return {
        ...state,
        threadcx: {
          ...state.threadcx,
          thread: action.thread,
          isPaused: !!threadState().frames,
          pauseCounter: state.threadcx.pauseCounter + 1,
        },
      };
    }

    case "PAUSED": {
      const { thread, frame, why, executionPoint } = action;

      state = {
        ...state,
        previewLocation: null,
        threadcx: {
          ...state.threadcx,
          pauseCounter: state.threadcx.pauseCounter + 1,
          thread,
          isPaused: true,
        },
      };
      return updateThreadState({
        isWaitingOnBreak: false,
        selectedFrameId: frame ? frame.id : undefined,
        frames: frame ? [frame] : undefined,
        framesLoading: true,
        frameScopes: { ...resumedPauseState.frameScopes },
        why,
        executionPoint,
      });
    }

    case "FETCHED_FRAMES": {
      const { frames } = action;
      const selectedFrameId = frames.length ? frames[0].id : undefined;
      return updateThreadState({
        frames,
        selectedFrameId,
        framesLoading: false,
      });
    }

    case "ADD_ASYNC_FRAMES": {
      const { asyncFrames } = action;
      return updateThreadState({
        frames: [...threadState().frames, ...asyncFrames],
      });
    }

    case "PREVIEW_PAUSED_LOCATION": {
      return { ...state, previewLocation: action.location };
    }

    case "CLEAR_PREVIEW_PAUSED_LOCATION": {
      return { ...state, previewLocation: null };
    }

    case "ADD_SCOPES": {
      const { frame, status, value } = action;
      const selectedFrameId = frame.id;

      const frameScopes = {
        ...threadState().frameScopes,
        [selectedFrameId]: {
          pending: status !== "done",
          scope: value,
        },
      };

      return updateThreadState({ frameScopes });
    }

    case "SET_FRAME_POSITIONS": {
      const { positions, unexecuted } = action;
      return { ...state, replayFramePositions: { positions, unexecuted } };
    }

    case "CLEAR_FRAME_POSITIONS": {
      return { ...state, replayFramePositions: null };
    }

    case "SET_FRAME_POSITIONS":
      return updateThreadState({
        replayFramePositions: {
          ...threadState().replayFramePositions,
          [action.frame]: action.positions,
        },
      });

    case "BREAK_ON_NEXT":
      return updateThreadState({ isWaitingOnBreak: true });

    case "SELECT_FRAME":
      return updateThreadState({ selectedFrameId: action.frame.id });

    case "CONNECT":
      return {
        ...createPauseState(action.mainThread.actor),
      };

    case "LOG_EXCEPTIONS": {
      const { shouldLogExceptions } = action;

      prefs.logExceptions = shouldLogExceptions;

      return {
        ...state,
        shouldLogExceptions,
      };
    }

    case "COMMAND":
      if (action.status === "start") {
        state = {
          ...state,
          threadcx: {
            ...state.threadcx,
            pauseCounter: state.threadcx.pauseCounter + 1,
            isPaused: false,
          },
        };
        return updateThreadState({
          ...resumedPauseState,
          command: action.command,
          lastCommand: action.command,
          previousLocation: getPauseLocation(threadState(), action),
        });
      }
      return updateThreadState({ command: null });

    case "RESUME": {
      if (action.thread == state.threadcx.thread) {
        state = {
          ...state,
          threadcx: {
            ...state.threadcx,
            pauseCounter: state.threadcx.pauseCounter + 1,
            isPaused: false,
          },
        };
      }
      return updateThreadState({
        ...resumedPauseState,
        wasStepping: !!action.wasStepping,
        expandedScopes: new Set(),
        lastExpandedScopes: [...threadState().expandedScopes],
      });
    }

    case "EVALUATE_EXPRESSION":
      return updateThreadState({
        command: action.status === "start" ? "expression" : null,
      });

    case "NAVIGATE": {
      const navigateCounter = state.cx.navigateCounter + 1;
      return {
        ...state,
        cx: {
          navigateCounter,
        },
        threadcx: {
          navigateCounter,
          thread: action.mainThread.actor,
          pauseCounter: 0,
          isPaused: false,
        },
        threads: {
          [action.mainThread.actor]: {
            ...getThreadPauseState(state, action.mainThread.actor),
            ...resumedPauseState,
          },
        },
      };
    }

    case "TOGGLE_SKIP_PAUSING": {
      const { skipPausing } = action;
      prefs.skipPausing = skipPausing;

      return { ...state, skipPausing };
    }

    case "SET_EXPANDED_SCOPE": {
      const { path, expanded } = action;
      const expandedScopes = new Set(threadState().expandedScopes);
      if (expanded) {
        expandedScopes.add(path);
      } else {
        expandedScopes.delete(path);
      }
      return updateThreadState({ expandedScopes });
    }

    case "ADD_INLINE_PREVIEW": {
      const { frameId, previews } = action;

      return updateThreadState({
        inlinePreview: {
          ...threadState().inlinePreview,
          [frameId]: previews,
        },
      });
    }

    case "BATCH":
      action.updates.forEach(u => (state = update(state, u)));
      return state;

    case "HIGHLIGHT_CALLS": {
      const { highlightedCalls } = action;
      return updateThreadState({ ...threadState(), highlightedCalls });
    }

    case "UNHIGHLIGHT_CALLS": {
      return updateThreadState({
        ...threadState(),
        highlightedCalls: null,
      });
    }
  }

  return state;
}

function getPauseLocation(state, action) {
  const { frames, previousLocation } = state;

  // NOTE: We store the previous location so that we ensure that we
  // do not stop at the same location twice when we step over.
  if (action.command !== "stepOver") {
    return null;
  }

  const frame = frames && frames[0];
  if (!frame) {
    return previousLocation;
  }

  return {
    location: frame.location,
    generatedLocation: frame.generatedLocation,
  };
}

// Selectors

export function getContext(state) {
  return state.pause.cx;
}

export function getThreadContext(state) {
  return state.pause.threadcx;
}

export function getPauseReason(state, thread) {
  return getThreadPauseState(state.pause, thread).why;
}

export function getPauseCommand(state, thread) {
  return getThreadPauseState(state.pause, thread).command;
}

export function wasStepping(state, thread) {
  return getThreadPauseState(state.pause, thread).wasStepping;
}

export function isStepping(state, thread) {
  return ["stepIn", "stepOver", "stepOut"].includes(getPauseCommand(state, thread));
}

export function getCurrentThread(state) {
  return getThreadContext(state).thread;
}

export function getIsPaused(state, thread) {
  return !!getThreadPauseState(state.pause, thread).frames;
}

export function getPreviousPauseFrameLocation(state, thread) {
  return getThreadPauseState(state.pause, thread).previousLocation;
}

export function isEvaluatingExpression(state, thread) {
  return getThreadPauseState(state.pause, thread).command === "expression";
}

export function getIsWaitingOnBreak(state, thread) {
  return getThreadPauseState(state.pause, thread).isWaitingOnBreak;
}

export function getShouldLogExceptions(state) {
  return state.pause.shouldLogExceptions;
}

export function getFrames(state, thread) {
  const { frames, framesLoading } = getThreadPauseState(state.pause, thread);
  return framesLoading ? null : frames;
}

export function getCurrentThreadFrames(state) {
  const { frames, framesLoading } = getThreadPauseState(state.pause, getCurrentThread(state));
  return framesLoading ? null : frames;
}

export function getFramesLoading(state, thread) {
  const { frames, framesLoading } = getThreadPauseState(state.pause, thread);
  return frames && framesLoading;
}

export function getFrameScope(state, thread, frameId) {
  if (!frameId) {
    return null;
  }

  const { frameScopes } = getThreadPauseState(state.pause, thread);
  return frameScopes[frameId];
}

export function getSelectedScope(state, thread) {
  const frameId = getSelectedFrameId(state, thread);
  const frameScopes = getFrameScope(state, thread, frameId);
  return frameScopes && frameScopes.scope;
}

export function getSelectedFrameId(state, thread) {
  return getThreadPauseState(state.pause, thread).selectedFrameId;
}

export function getTopFrame(state, thread) {
  const frames = getFrames(state, thread);
  return frames && frames[0];
}

export function isTopFrame(state, thread) {
  const topFrame = getTopFrame(state, thread);
  const selectedFrame = getSelectedFrame(state, thread);
  return topFrame == selectedFrame;
}

export function getThreadExecutionPoint(state, thread) {
  return getThreadPauseState(state.pause, thread).executionPoint;
}

export function getSkipPausing(state) {
  return state.pause.skipPausing;
}

export function getHighlightedCalls(state, thread) {
  return getThreadPauseState(state.pause, thread).highlightedCalls;
}

export function getInlinePreviews(state, thread, frameId) {
  return getThreadPauseState(state.pause, thread).inlinePreview[frameId];
}

export function getSelectedInlinePreviews(state) {
  const thread = getCurrentThread(state);
  const frameId = getSelectedFrameId(state, thread);
  if (!frameId) {
    return null;
  }

  return getInlinePreviews(state, thread, frameId);
}

export function getInlinePreviewExpression(
  state,
  thread,
  frameId,
  line,
  expression
) {
  const previews = getThreadPauseState(state.pause, thread).inlinePreview[frameId];
  return previews && previews[line] && previews[line][expression];
}

export function getLastExpandedScopes(state, thread) {
  return getThreadPauseState(state.pause, thread).lastExpandedScopes;
}

export function getPausePreviewLocation(state) {
  return state.pause.previewLocation;
}

export function getResumePoint(state, type) {
  const thread = getCurrentThread(state);
  const framePoints = getFramePositions(state, thread)?.positions.map(p => p.point);
  const executionPoint = getThreadExecutionPoint(state, thread);

  if (!framePoints || isTopFrame(state, thread)) {
    return null;
  }

  if (type == "reverseStepOver" || type == "rewind") {
    return findLast(framePoints, p => BigInt(p) < BigInt(executionPoint));
  }

  if (type == "stepOver" || type == "resume" || type == "stepIn" || type == "stepUp") {
    return find(framePoints, p => BigInt(p) > BigInt(executionPoint));
  }
}

// Get the ID of any alternate source that can be switched to from selectedSource.
// This only works when the debugger is paused somewhere, and we have an
// alternate location for the location of the selected frame.
export function getAlternateSourceId(state, selectedSource) {
  if (!selectedSource) {
    return null;
  }
  const thread = getCurrentThread(state);
  const frames = getFrames(state, thread);
  if (!frames) {
    return null;
  }
  const selectedFrameId = getSelectedFrameId(state, thread);
  const selectedFrame = frames.find(f => f.id == selectedFrameId);
  if (!selectedFrame || selectedFrame.location.sourceId != selectedSource.id) {
    return null;
  }
  const { alternateLocation } = selectedFrame;
  return alternateLocation ? alternateLocation.sourceId : null;
}

export default update;
