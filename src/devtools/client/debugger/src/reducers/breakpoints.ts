/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Breakpoints reducer
 * @module reducers/breakpoints
 */

import { Location } from "@recordreplay/protocol";
import type { AnyAction } from "@reduxjs/toolkit";
import type { UIState } from "ui/state";

import { getSelectedSource } from "../selectors";

// eslint-disable-next-line max-len
import { getBreakpointsList } from "../selectors/breakpoints";
import assert from "../utils/assert";
import { getLocationKey, isMatchingLocation, isLogpoint } from "../utils/breakpoint";

import type { Breakpoint } from "./types";
export type { Breakpoint } from "./types";

export interface BreakpointsState {
  breakpoints: Record<string, Breakpoint>;
  requestedBreakpoints: Record<string, Location>;
  breakpointsDisabled: boolean;
}

export function initialBreakpointsState(): BreakpointsState {
  return {
    breakpoints: {},
    breakpointsDisabled: false,
    requestedBreakpoints: {},
  };
}

function update(state = initialBreakpointsState(), action: AnyAction) {
  switch (action.type) {
    case "SET_REQUESTED_BREAKPOINT": {
      return setRequestedBreakpoint(state, action);
    }

    case "SET_BREAKPOINT": {
      return setBreakpoint(state, action);
    }

    case "REMOVE_BREAKPOINT": {
      return removeBreakpoint(state, action);
    }

    case "REMOVE_REQUESTED_BREAKPOINT": {
      return removeRequestedBreakpoint(state, action);
    }

    case "REMOVE_BREAKPOINTS": {
      return { ...state, breakpoints: {}, requestedBreakpoints: {} };
    }
  }

  return state;
}

function setRequestedBreakpoint(state: BreakpointsState, { location }: AnyAction) {
  assert(!location.column, "location should have no column");
  const requestedId = getLocationKey(location);
  const requestedBreakpoints = { ...state.requestedBreakpoints, [requestedId]: location };
  return { ...state, requestedBreakpoints };
}

function setBreakpoint(state: BreakpointsState, { breakpoint }: AnyAction) {
  const location = breakpoint.location;
  const id = getLocationKey(location);
  const breakpoints = { ...state.breakpoints, [id]: breakpoint };
  return { ...removeRequestedBreakpoint(state, { location } as any), breakpoints };
}

function removeRequestedBreakpoint(state: BreakpointsState, { location }: AnyAction) {
  const requestedId = getLocationKey({ ...location, column: undefined });
  const requestedBreakpoints = { ...state.requestedBreakpoints };
  delete requestedBreakpoints[requestedId];
  return { ...state, requestedBreakpoints };
}

function removeBreakpoint(state: BreakpointsState, { location }: AnyAction) {
  const id = getLocationKey(location);
  const breakpoints = { ...state.breakpoints };
  delete breakpoints[id];
  return { ...state, breakpoints };
}

// Selectors
// TODO: these functions should be moved out of the reducer

export function getBreakpointsMap(state: UIState) {
  return state.breakpoints.breakpoints;
}

export function getBreakpointCount(state: UIState) {
  return getBreakpointsList(state).length;
}

export function getLogpointCount(state: UIState) {
  return getBreakpointsList(state).filter(bp => isLogpoint(bp)).length;
}

export function getBreakpoint(state: UIState, location?: Location) {
  if (!location) {
    return undefined;
  }

  const breakpoints = getBreakpointsMap(state);
  return breakpoints[getLocationKey(location)];
}

export function getBreakpointsDisabled(state: UIState) {
  const breakpoints = getBreakpointsList(state);
  return breakpoints.every(breakpoint => breakpoint.disabled);
}

export function getBreakpointsForSourceId(state: UIState, line?: number) {
  const { id: sourceId } = getSelectedSource(state)!;

  if (!sourceId) {
    return [];
  }

  return getBreakpointsForSource(state, sourceId, line);
}

export function getBreakpointsForSource(state: UIState, sourceId: string, line?: number) {
  if (!sourceId) {
    return [];
  }

  const breakpoints = getBreakpointsList(state);
  return breakpoints.filter(bp => {
    const location = bp.location;
    return location.sourceId === sourceId && (!line || line == location.line);
  });
}

export function getBreakpointForLocation(state: UIState, location?: Location) {
  if (!location) {
    return undefined;
  }

  return getBreakpointsList(state).find(bp => {
    const loc = bp.location;
    // @ts-ignore
    return isMatchingLocation(loc, location);
  });
}

export function hasLogpoint(state: UIState, location?: Location) {
  const breakpoint = getBreakpoint(state, location);
  return breakpoint && breakpoint.options.logValue;
}

export function getLogpointsForSource(state: UIState, sourceId: string) {
  if (!sourceId) {
    return [];
  }

  const breakpoints = getBreakpointsList(state);
  return breakpoints.filter(bp => bp.location.sourceId === sourceId).filter(bp => isLogpoint(bp));
}

export default update;
