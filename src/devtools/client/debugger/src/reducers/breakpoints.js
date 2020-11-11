/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Breakpoints reducer
 * @module reducers/breakpoints
 */

import { isEqual } from "lodash";

import { makeBreakpointId } from "../utils/breakpoint";

// eslint-disable-next-line max-len
import { getBreakpointsList as getBreakpointsListSelector } from "../selectors/breakpoints";

export function initialBreakpointsState() {
  return {
    breakpoints: {},
    breakpointsDisabled: false,
  };
}

function update(state = initialBreakpointsState(), action) {
  switch (action.type) {
    case "SET_BREAKPOINT": {
      return setBreakpoint(state, action);
    }

    case "REMOVE_BREAKPOINT": {
      return removeBreakpoint(state, action);
    }

    case "REMOVE_BREAKPOINTS": {
      return { ...state, breakpoints: {} };
    }

    case "NAVIGATE": {
      return initialBreakpointsState();
    }

    case "SET_XHR_BREAKPOINT": {
      return addXHRBreakpoint(state, action);
    }

    case "REMOVE_XHR_BREAKPOINT": {
      return removeXHRBreakpoint(state, action);
    }

    case "UPDATE_XHR_BREAKPOINT": {
      return updateXHRBreakpoint(state, action);
    }

    case "ENABLE_XHR_BREAKPOINT": {
      return updateXHRBreakpoint(state, action);
    }

    case "DISABLE_XHR_BREAKPOINT": {
      return updateXHRBreakpoint(state, action);
    }
  }

  return state;
}

function setBreakpoint(state, { breakpoint }) {
  const id = makeBreakpointId(breakpoint.location);
  const breakpoints = { ...state.breakpoints, [id]: breakpoint };
  return { ...state, breakpoints };
}

function removeBreakpoint(state, { location }) {
  const id = makeBreakpointId(location);
  const breakpoints = { ...state.breakpoints };
  delete breakpoints[id];
  return { ...state, breakpoints };
}

function isMatchingLocation(location1, location2) {
  return isEqual(location1, location2);
}

// Selectors
// TODO: these functions should be moved out of the reducer

export function getBreakpointsMap(state) {
  return state.breakpoints.breakpoints;
}

export function getBreakpointsList(state) {
  return getBreakpointsListSelector(state);
}

export function getBreakpointCount(state) {
  return getBreakpointsList(state).length;
}

export function getBreakpoint(state, location) {
  if (!location) {
    return undefined;
  }

  const breakpoints = getBreakpointsMap(state);
  return breakpoints[makeBreakpointId(location)];
}

export function getBreakpointsDisabled(state) {
  const breakpoints = getBreakpointsList(state);
  return breakpoints.every(breakpoint => breakpoint.disabled);
}

export function getBreakpointsForSource(state, sourceId, line) {
  if (!sourceId) {
    return [];
  }

  const breakpoints = getBreakpointsList(state);
  return breakpoints.filter(bp => {
    const location = bp.location;
    return location.sourceId === sourceId && (!line || line == location.line);
  });
}

export function getBreakpointForLocation(state, location) {
  if (!location) {
    return undefined;
  }

  return getBreakpointsList(state).find(bp => {
    const loc = bp.location;
    return isMatchingLocation(loc, location);
  });
}

export function hasLogpoint(state, location) {
  const breakpoint = getBreakpoint(state, location);
  return breakpoint && breakpoint.options.logValue;
}

export default update;
