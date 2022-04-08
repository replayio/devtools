/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
/* eslint complexity: ["error", 35]*/

/**
 * Pause reducer
 * @module reducers/pause
 */

import type { Action } from "@reduxjs/toolkit";
import type { Location, Scope } from "@recordreplay/protocol";
import type { AnyAction } from "@reduxjs/toolkit";
import type { UIState } from "ui/state";
import type { Source } from "./sources";

import { prefs } from "../utils/prefs";
import { getSelectedFrame, getFramePositions } from "../selectors/pause";
import find from "lodash/find";
import findLast from "lodash/findLast";
import { compareNumericStrings } from "protocol/utils";
import { getSelectedSourceWithContent, getSource } from "./sources";

export interface Context {
  isPaused: boolean;
  navigateCounter: number;
  pauseCounter: number;
}

export interface UrlLocation extends Location {
  sourceUrl: string;
}

export interface SelectedFrame {
  id: string;
  alternateLocation?: UrlLocation;
  generatedLocation?: UrlLocation;
  displayName: string;
  protocolId: string;
  asyncIndex: number;
  location: UrlLocation;
}

// TBD
interface UnknownPositions {
  point: string;
}

interface ScopeDetails {
  pending: boolean;
  originalScopesUnavailable: boolean;
  scope: Scope;
}

export interface PauseState {
  cx: { navigateCounter: number };
  threadcx: Context;
  pausePreviewLocation: Location | null;
  frames: SelectedFrame[] | null;
  framesLoading: boolean;
  frameScopes: Record<string, ScopeDetails>;
  selectedFrameId: string | null;
  executionPoint: string | null;
  why: string | null;
  isWaitingOnBreak: boolean;
  command: string | null;
  lastCommand: string | null;
  previousLocation: Location | null;
  expandedScopes: Set<string>;
  lastExpandedScopes: [];
  shouldLogExceptions: boolean;
  replayFramePositions?: { positions: UnknownPositions[]; unexecuted: unknown } | null;
}

function createPauseState(): PauseState {
  return {
    cx: {
      navigateCounter: 0,
    },
    threadcx: {
      navigateCounter: 0,
      isPaused: false,
      pauseCounter: 0,
    },
    pausePreviewLocation: null,
    ...resumedPauseState,
    isWaitingOnBreak: false,
    command: null,
    lastCommand: null,
    previousLocation: null,
    expandedScopes: new Set(),
    lastExpandedScopes: [],
    shouldLogExceptions: prefs.logExceptions as boolean,
  };
}

const resumedPauseState = {
  frames: null,
  framesLoading: false,
  frameScopes: {},
  selectedFrameId: null,
  executionPoint: null,
  why: null,
};

interface CommandAction extends Action<"COMMAND"> {
  command: string;
}

function update(state = createPauseState(), action: AnyAction) {
  if (action.cx && action.cx.pauseCounter !== state.threadcx.pauseCounter) {
    return state;
  }
  switch (action.type) {
    case "PAUSED": {
      const { frame, why, executionPoint } = action;

      state = {
        ...state,
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
      return { ...state, frames: [...state.frames!, ...asyncFrames] };
    }

    case "SET_PREVIEW_PAUSED_LOCATION": {
      return { ...state, pausePreviewLocation: action.location };
    }

    case "CLEAR_PREVIEW_PAUSED_LOCATION": {
      return { ...state, pausePreviewLocation: null };
    }

    case "ADD_SCOPES": {
      const { frame, status, value } = action;
      const selectedFrameId = frame.id;

      const frameScopes = {
        ...state.frameScopes,
        [selectedFrameId]: {
          pending: status !== "done",
          originalScopesUnavailable: !!value?.originalScopesUnavailable,
          scope: value?.scopes,
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
          previousLocation: getPauseLocation(state, action as CommandAction),
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
        expandedScopes: new Set(),
        lastExpandedScopes: [state.expandedScopes],
      };
    }

    case "EVALUATE_EXPRESSION":
      return { ...state, command: action.status === "start" ? "expression" : null };

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
  }

  return state;
}

function getPauseLocation(state: PauseState, action: CommandAction) {
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

export function getIsPaused(state: UIState) {
  return !!state.pause.frames;
}

export function hasFrames(state: UIState) {
  return !!getTopFrame(state);
}

export function getPreviousPauseFrameLocation(state: UIState) {
  return state.pause.previousLocation;
}

export function isEvaluatingExpression(state: UIState) {
  return state.pause.command === "expression";
}

export function getIsWaitingOnBreak(state: UIState) {
  return state.pause.isWaitingOnBreak;
}

export function getShouldLogExceptions(state: UIState) {
  return state.pause.shouldLogExceptions;
}

export function getFrames(state: UIState) {
  const { frames, framesLoading } = state.pause;
  return framesLoading ? null : frames;
}

export function getFramesLoading(state: UIState) {
  const { frames, framesLoading } = state.pause;
  return frames && framesLoading;
}

export function getFrameScope(state: UIState, frameId: string) {
  if (!frameId) {
    return null;
  }

  const { frameScopes } = state.pause;
  return frameScopes[frameId];
}

export function getSelectedScope(state: UIState) {
  const frameId = getSelectedFrameId(state)!;
  const frameScopes = getFrameScope(state, frameId);
  return frameScopes && frameScopes.scope;
}

export function getSelectedFrameId(state: UIState) {
  return state.pause.selectedFrameId;
}

export function getTopFrame(state: UIState) {
  const frames = getFrames(state);
  return frames && frames[0];
}

export function isTopFrame(state: UIState) {
  const topFrame = getTopFrame(state);
  const selectedFrame = getSelectedFrame(state);
  return topFrame == selectedFrame;
}

export function getExecutionPoint(state: UIState) {
  return state.pause.executionPoint;
}

export function getLastExpandedScopes(state: UIState) {
  return state.pause.lastExpandedScopes;
}

export function getPausePreviewLocation(state: UIState) {
  return state.pause.pausePreviewLocation;
}

export function getResumePoint(state: UIState, type: string) {
  const framePoints = getFramePositions(state)?.positions.map(p => p.point);
  const executionPoint = getExecutionPoint(state);

  if (!framePoints || isTopFrame(state)) {
    return null;
  }

  if (type == "reverseStepOver" || type == "rewind") {
    return findLast(framePoints, p => compareNumericStrings(p, executionPoint!) < 0);
  }

  if (type == "stepOver" || type == "resume" || type == "stepIn" || type == "stepUp") {
    return find(framePoints, p => compareNumericStrings(p, executionPoint!) > 0);
  }
}

// Get the ID of any alternate source that can be switched to from selectedSource.
// This only works when the debugger is paused somewhere, and we have an
// alternate location for the location of the selected frame.
function getAlternateSourceId(state: UIState, selectedSource: Source) {
  if (!selectedSource) {
    return null;
  }
  const frames = getFrames(state);
  if (!frames) {
    return null;
  }
  const selectedFrameId = getSelectedFrameId(state);
  const selectedFrame = frames.find(f => f.id == selectedFrameId);
  // @ts-ignore no sourceId in Location
  if (!selectedFrame || selectedFrame.location.sourceId != selectedSource.id) {
    return null;
  }
  const { alternateLocation } = selectedFrame;
  return alternateLocation ? alternateLocation.sourceId : null;
}

export function getAlternateSource(state: UIState) {
  const selectedSource = getSelectedSourceWithContent(state);
  // @ts-ignore content mismatch
  const alternateSourceId = getAlternateSourceId(state, selectedSource!);

  if (!alternateSourceId) {
    return null;
  }

  return getSource(state, alternateSourceId);
}

export default update;
