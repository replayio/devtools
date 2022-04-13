/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { AnyAction } from "@reduxjs/toolkit";
import type { UIState } from "ui/state";

import { PendingBreakpoint } from "./types";

/**
 * Pending breakpoints reducer
 * @module reducers/pending-breakpoints
 */

import { createPendingBreakpoint, makePendingLocationId } from "../utils/breakpoint";

export type PendingBreakpointsState = Record<string, PendingBreakpoint>;

function update(state: PendingBreakpointsState = {}, action: AnyAction) {
  switch (action.type) {
    case "SET_BREAKPOINT":
      return setBreakpoint(state, action);

    case "REMOVE_BREAKPOINT":
      return removeBreakpoint(state, action);

    case "REMOVE_PENDING_BREAKPOINT":
      return removeBreakpoint(state, action);

    case "REMOVE_BREAKPOINTS": {
      return {};
    }
  }

  return state;
}

function setBreakpoint(state: PendingBreakpointsState, { breakpoint }: AnyAction) {
  const locationId = makePendingLocationId(breakpoint.location);
  const pendingBreakpoint = createPendingBreakpoint(breakpoint);

  return { ...state, [locationId]: pendingBreakpoint };
}

function removeBreakpoint(state: PendingBreakpointsState, { location }: AnyAction) {
  const locationId = makePendingLocationId(location);

  state = { ...state };
  delete state[locationId];
  return state;
}

// Selectors
// TODO: these functions should be moved out of the reducer

export function getPendingBreakpoints(state: UIState) {
  return state.pendingBreakpoints;
}

export function getPendingBreakpointList(state: UIState, recordingId: string) {
  return Object.entries(getPendingBreakpoints(state))
    .filter(([key]) => key.startsWith(recordingId))
    .map(([_, value]) => value);
}

export function getPendingBreakpointsForSource(
  state: UIState,
  source: { url?: string },
  recordingId: string
) {
  return getPendingBreakpointList(state, recordingId).filter(pendingBreakpoint => {
    return pendingBreakpoint.location.sourceUrl === source.url;
  });
}

export default update;
