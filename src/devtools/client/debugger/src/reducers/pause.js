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
import { getSelectedFrame, getFramePositions } from "../selectors/pause";
import { findLast, find } from "lodash";
import { compareNumericStrings } from "protocol/utils";

function createPauseState() {
  return {
    cx: {
      navigateCounter: 0,
    },
    threadcx: {
      navigateCounter: 0,
      isPaused: false,
      pauseCounter: 0,
    },
    previewLocation: null,
    ...resumedPauseState,
    isWaitingOnBreak: false,
    command: null,
    lastCommand: null,
    previousLocation: null,
    expandedScopes: new Set(),
    lastExpandedScopes: [],
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
};

function update(state = createPauseState(), action) {
  switch (action.type) {
    case "PAUSED": {
      const { frame, why, executionPoint } = action;

      state = {
        ...state,
        previewLocation: null,
        threadcx: {
          ...state.threadcx,
          pauseCounter: state.threadcx.pauseCounter + 1,
          isPaused: true,
        },
      };
      return {
        ...state,
        isWaitingOnBreak: false,
        selectedFrameId: frame ? frame.id : undefined,
        frames: frame ? [frame] : undefined,
        framesLoading: true,
        frameScopes: { ...resumedPauseState.frameScopes },
        why,
        executionPoint,
      };
    }

    case "FETCHED_FRAMES": {
      const { frames } = action;
      const selectedFrameId = frames && frames.length ? frames[0].id : undefined;
      return {
        ...state,
        frames,
        selectedFrameId,
        framesLoading: false,
      };
    }

    case "ADD_ASYNC_FRAMES": {
      const { asyncFrames } = action;
      return { ...state, frames: [...state.frames, ...asyncFrames] };
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
        ...state.frameScopes,
        [selectedFrameId]: {
          pending: status !== "done",
          scope: value,
        },
      };

      return { ...state, frameScopes };
    }

    case "SET_FRAME_POSITIONS": {
      const { positions, unexecuted } = action;
      return { ...state, replayFramePositions: { positions, unexecuted } };
    }

    case "CLEAR_FRAME_POSITIONS": {
      return { ...state, replayFramePositions: null };
    }

    case "SET_FRAME_POSITIONS":
      return {
        ...state,
        replayFramePositions: {
          ...state.replayFramePositions,
          [action.frame]: action.positions,
        },
      };

    case "BREAK_ON_NEXT":
      return { ...state, isWaitingOnBreak: true };

    case "SELECT_FRAME":
      return { ...state, selectedFrameId: action.frame.id };

    case "CONNECT":
      return {
        ...createPauseState(),
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
        return {
          ...state,
          ...resumedPauseState,
          command: action.command,
          lastCommand: action.command,
          previousLocation: getPauseLocation(state, action),
        };
      }
      return { ...state, command: null };

    case "RESUME": {
      state = {
        ...state,
        threadcx: {
          ...state.threadcx,
          pauseCounter: state.threadcx.pauseCounter + 1,
          isPaused: false,
        },
      };
      return {
        ...state,
        ...resumedPauseState,
        wasStepping: !!action.wasStepping,
        expandedScopes: new Set(),
        lastExpandedScopes: [state.expandedScopes],
      };
    }

    case "EVALUATE_EXPRESSION":
      return { ...state, command: action.status === "start" ? "expression" : null };

    case "NAVIGATE": {
      const navigateCounter = state.cx.navigateCounter + 1;
      return {
        ...state,
        cx: {
          navigateCounter,
        },
        threadcx: {
          navigateCounter,
          pauseCounter: 0,
          isPaused: false,
        },
        ...resumedPauseState,
      };
    }

    case "TOGGLE_SKIP_PAUSING": {
      const { skipPausing } = action;
      prefs.skipPausing = skipPausing;

      return { ...state, skipPausing };
    }

    case "SET_EXPANDED_SCOPE": {
      const { path, expanded } = action;
      const expandedScopes = new Set(state.expandedScopes);
      if (expanded) {
        expandedScopes.add(path);
      } else {
        expandedScopes.delete(path);
      }
      return { ...state, expandedScopes };
    }

    case "ADD_INLINE_PREVIEW": {
      const { frameId, previews } = action;

      return {
        ...state,
        inlinePreview: {
          ...state.inlinePreview,
          [frameId]: previews,
        },
      };
    }

    case "BATCH":
      action.updates.forEach(u => (state = update(state, u)));
      return state;
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

export function getPauseReason(state) {
  return state.pause.why;
}

export function getPauseCommand(state) {
  return state.pause.command;
}

export function wasStepping(state) {
  return state.pause.wasStepping;
}

export function isStepping(state) {
  return ["stepIn", "stepOver", "stepOut"].includes(getPauseCommand(state));
}

export function getIsPaused(state) {
  return !!state.pause.frames;
}

export function getPreviousPauseFrameLocation(state) {
  return state.pause.previousLocation;
}

export function isEvaluatingExpression(state) {
  return state.pause.command === "expression";
}

export function getIsWaitingOnBreak(state) {
  return state.pause.isWaitingOnBreak;
}

export function getShouldLogExceptions(state) {
  return state.pause.shouldLogExceptions;
}

export function getFrames(state) {
  const { frames, framesLoading } = state.pause;
  return framesLoading ? null : frames;
}

export function getCurrentFrames(state) {
  const { frames, framesLoading } = state.pause;
  return framesLoading ? null : frames;
}

export function getFramesLoading(state) {
  const { frames, framesLoading } = state.pause;
  return frames && framesLoading;
}

export function getFrameScope(state, frameId) {
  if (!frameId) {
    return null;
  }

  const { frameScopes } = state.pause;
  return frameScopes[frameId];
}

export function getSelectedScope(state) {
  const frameId = getSelectedFrameId(state);
  const frameScopes = getFrameScope(state, frameId);
  return frameScopes && frameScopes.scope;
}

export function getSelectedFrameId(state) {
  return state.pause.selectedFrameId;
}

export function getTopFrame(state) {
  const frames = getFrames(state);
  return frames && frames[0];
}

export function isTopFrame(state) {
  const topFrame = getTopFrame(state);
  const selectedFrame = getSelectedFrame(state);
  return topFrame == selectedFrame;
}

export function getThreadExecutionPoint(state) {
  return state.pause.executionPoint;
}

export function getSkipPausing(state) {
  return state.pause.skipPausing;
}

export function getInlinePreviews(state, frameId) {
  return state.pause.inlinePreview[frameId];
}

export function getSelectedInlinePreviews(state) {
  const frameId = getSelectedFrameId(state);
  if (!frameId) {
    return null;
  }

  return getInlinePreviews(state, frameId);
}

export function getInlinePreviewExpression(state, frameId, line, expression) {
  const previews = state.pause.inlinePreview[frameId];
  return previews && previews[line] && previews[line][expression];
}

export function getLastExpandedScopes(state) {
  return state.pause.lastExpandedScopes;
}

export function getPausePreviewLocation(state) {
  return state.pause.previewLocation;
}

export function getResumePoint(state, type) {
  const framePoints = getFramePositions(state)?.positions.map(p => p.point);
  const executionPoint = getThreadExecutionPoint(state);

  if (!framePoints || isTopFrame(state)) {
    return null;
  }

  if (type == "reverseStepOver" || type == "rewind") {
    return findLast(framePoints, p => compareNumericStrings(p, executionPoint) < 0);
  }

  if (type == "stepOver" || type == "resume" || type == "stepIn" || type == "stepUp") {
    return find(framePoints, p => compareNumericStrings(p, executionPoint) > 0);
  }
}

// Get the ID of any alternate source that can be switched to from selectedSource.
// This only works when the debugger is paused somewhere, and we have an
// alternate location for the location of the selected frame.
export function getAlternateSourceId(state, selectedSource) {
  if (!selectedSource) {
    return null;
  }
  const frames = getFrames(state);
  if (!frames) {
    return null;
  }
  const selectedFrameId = getSelectedFrameId(state);
  const selectedFrame = frames.find(f => f.id == selectedFrameId);
  if (!selectedFrame || selectedFrame.location.sourceId != selectedSource.id) {
    return null;
  }
  const { alternateLocation } = selectedFrame;
  return alternateLocation ? alternateLocation.sourceId : null;
}

export default update;
