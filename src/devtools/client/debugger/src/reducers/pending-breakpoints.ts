/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Pending breakpoints reducer
 * @module reducers/pending-breakpoints
 */

import { createPendingBreakpoint, makePendingLocationId } from "../utils/breakpoint";

function update(state = {}, action) {
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

function setBreakpoint(state, { breakpoint }) {
  const locationId = makePendingLocationId(breakpoint.location);
  const pendingBreakpoint = createPendingBreakpoint(breakpoint);

  return { ...state, [locationId]: pendingBreakpoint };
}

function removeBreakpoint(state, { location }) {
  const locationId = makePendingLocationId(location);

  state = { ...state };
  delete state[locationId];
  return state;
}

// Selectors
// TODO: these functions should be moved out of the reducer

export function getPendingBreakpoints(state) {
  return state.pendingBreakpoints;
}

export function getPendingBreakpointList(state, recordingId) {
  return Object.entries(getPendingBreakpoints(state))
    .filter(([key]) => key.startsWith(recordingId))
    .map(([_, value]) => value);
}

export function getPendingBreakpointsForSource(state, source, recordingId) {
  return getPendingBreakpointList(state, recordingId).filter(pendingBreakpoint => {
    return pendingBreakpoint.location.sourceUrl === source.url;
  });
}

export default update;
