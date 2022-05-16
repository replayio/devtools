/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { Location } from "@recordreplay/protocol";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import type { UIState } from "ui/state";

import { getBreakpointsList } from "../selectors/breakpoints";
import assert from "../utils/assert";
import { getLocationKey, isMatchingLocation, isLogpoint } from "../utils/breakpoint";

import { getSelectedSource } from "./sources";
import type { Breakpoint, SourceLocation } from "./types";
export type { Breakpoint } from "./types";

type LocationWithoutColumn = Omit<Location, "column">;
export interface BreakpointsState {
  breakpoints: Record<string, Breakpoint>;
  requestedBreakpoints: Record<string, LocationWithoutColumn>;
  breakpointsDisabled: boolean;
}

export function initialBreakpointsState(): BreakpointsState {
  return {
    breakpoints: {},
    breakpointsDisabled: false,
    requestedBreakpoints: {},
  };
}

const breakpointsSlice = createSlice({
  name: "breakpoints",
  initialState: initialBreakpointsState(),
  reducers: {
    setBreakpoint: {
      reducer(state, action: PayloadAction<Breakpoint>) {
        const breakpoint = action.payload;
        const location = breakpoint.location;
        const id = getLocationKey(location);
        state.breakpoints[id] = breakpoint;

        // Also remove any requested breakpoint that corresponds to this location
        breakpointsSlice.caseReducers.removeRequestedBreakpoint(
          state,
          breakpointsSlice.actions.removeRequestedBreakpoint(location)
        );
      },
      prepare(breakpoint: Breakpoint, cx?: Context) {
        // Add cx to action.meta
        return {
          payload: breakpoint,
          meta: { cx },
        };
      },
    },
    removeBreakpoint: {
      reducer(state, action: PayloadAction<SourceLocation>) {
        const id = getLocationKey(action.payload);
        delete state.breakpoints[id];
      },
      prepare(location: SourceLocation, cx?: Context) {
        // Add cx to action.meta
        return {
          payload: location,
          meta: { cx },
        };
      },
    },
    setRequestedBreakpoint(state, action: PayloadAction<LocationWithoutColumn>) {
      const location = action.payload;
      // @ts-ignore intentional field check
      assert(!location.column, "location should have no column");
      const requestedId = getLocationKey(location);
      state.requestedBreakpoints[requestedId] = location;
    },
    removeRequestedBreakpoint(state, action: PayloadAction<LocationWithoutColumn>) {
      const requestedId = getLocationKey({ ...action.payload, column: undefined });
      delete state.requestedBreakpoints[requestedId];
    },
    removeBreakpoints(state) {
      state.breakpoints = {};
      state.requestedBreakpoints = {};
    },
  },
});

export const {
  removeBreakpoint,
  removeBreakpoints,
  removeRequestedBreakpoint,
  setBreakpoint,
  setRequestedBreakpoint,
} = breakpointsSlice.actions;

export default breakpointsSlice.reducer;

// Selectors

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
