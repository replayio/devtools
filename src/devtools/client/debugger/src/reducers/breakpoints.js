/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Breakpoints reducer
 * @module reducers/breakpoints
 */

import {
  getLocationKey,
  isBreakable,
  isMatchingLocation,
  isPrintStatement,
} from "../utils/breakpoint";
import { getSelectedSource } from "../selectors";

// eslint-disable-next-line max-len
import { getBreakpointsList } from "../selectors/breakpoints";
import assert from "../utils/assert";

export function initialBreakpointsState() {
  return {
    breakpoints: {},
    requestedBreakpoints: {},
    breakpointsDisabled: false,
  };
}

function update(state = initialBreakpointsState(), action) {
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

function setRequestedBreakpoint(state, { location }) {
  assert(!location.column);
  const requestedId = getLocationKey(location);
  const requestedBreakpoints = { ...state.requestedBreakpoints, [requestedId]: location };
  return { ...state, requestedBreakpoints };
}

function setBreakpoint(state, { breakpoint }) {
  const location = breakpoint.location;
  const id = getLocationKey(location);
  const breakpoints = { ...state.breakpoints, [id]: breakpoint };
  return { ...removeRequestedBreakpoint(state, { location }), breakpoints };
}

function removeRequestedBreakpoint(state, { location }) {
  const requestedId = getLocationKey({ ...location, column: undefined });
  const requestedBreakpoints = { ...state.requestedBreakpoints };
  delete requestedBreakpoints[requestedId];
  return { ...state, requestedBreakpoints };
}

function removeBreakpoint(state, { location }) {
  const id = getLocationKey(location);
  const breakpoints = { ...state.breakpoints };
  delete breakpoints[id];
  return { ...state, breakpoints };
}

// Selectors
// TODO: these functions should be moved out of the reducer

export function getBreakpointsMap(state) {
  return state.breakpoints.breakpoints;
}

export function getBreakpointCount(state) {
  return getBreakpointsList(state).length;
}

export function getBreakpoint(state, location) {
  if (!location) {
    return undefined;
  }

  const breakpoints = getBreakpointsMap(state);
  return breakpoints[getLocationKey(location)];
}

export function getBreakpointsDisabled(state) {
  const breakpoints = getBreakpointsList(state);
  return breakpoints.every(breakpoint => breakpoint.disabled);
}

export function getPrintStatementsForSource(state, sourceId, line) {
  if (!sourceId) {
    return [];
  }

  const breakpoints = getBreakpointsList(state);
  return breakpoints
    .filter(bp => {
      const location = bp.location;
      return location.sourceId === sourceId && (!line || line == location.line);
    })
    .filter(bp => isPrintStatement(bp));
}

export function getBreakpointsForSourceId(state, line) {
  const { id: sourceId } = getSelectedSource(state);

  if (!sourceId) {
    return [];
  }

  return getBreakpointsForSource(state, sourceId, line);
}

export function getBreakableBreakpointsForSource(state, sourceId, line) {
  if (!sourceId) {
    return [];
  }

  const breakpoints = getBreakpointsList(state);
  return breakpoints.filter(bp => {
    const location = bp.location;
    return location.sourceId === sourceId && (!line || line == location.line) && isBreakable(bp);
  });
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

  const list = getBreakpointsList(state);
  const ret = list.find(bp => {
    const loc = bp.location;
    return isMatchingLocation(loc, location);
  });

  return ret;
}

export function hasLogpoint(state, location) {
  const breakpoint = getBreakpoint(state, location);
  return breakpoint && breakpoint.options.logValue;
}

export default update;
