/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Redux actions for breakpoints
 * @module actions/breakpoints
 */

import { getFilename } from "devtools/client/debugger/src/utils/source";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { trackEvent } from "ui/utils/telemetry";

import {
  getBreakpointsList,
  getSelectedSource,
  getBreakpointAtLocation,
  getBreakpointsForSource,
  getFirstBreakpointPosition,
  getSymbols,
  getThreadContext,
} from "../../selectors";
import { findClosestEnclosedSymbol } from "../../utils/ast";

import { setBreakpointPositions } from "./breakpointPositions";
import {
  addBreakpoint,
  _removeBreakpoint,
  enableBreakpoint,
  disableBreakpoint,
  runAnalysis,
} from "./modify";

// this will need to be changed so that addCLientBreakpoint is removed

export * from "./breakpointPositions";
export * from "./modify";
export * from "./syncBreakpoint";

/**
 * Disable all breakpoints in a source
 *
 * @memberof actions/breakpoints
 * @static
 */
export function disableBreakpointsInSource(cx, source) {
  return async (dispatch, getState) => {
    const breakpoints = getBreakpointsForSource(getState(), source.id);
    for (const breakpoint of breakpoints) {
      if (!breakpoint.disabled) {
        dispatch(disableBreakpoint(cx, breakpoint));
      }
    }
  };
}

/**
 * Enable all breakpoints in a source
 *
 * @memberof actions/breakpoints
 * @static
 */
export function enableBreakpointsInSource(cx, source) {
  return async (dispatch, getState) => {
    trackEvent("breakpoints.remove_all_in_source");
    const breakpoints = getBreakpointsForSource(getState(), source.id);
    for (const breakpoint of breakpoints) {
      if (breakpoint.disabled) {
        dispatch(enableBreakpoint(cx, breakpoint));
      }
    }
  };
}

/**
 * Removes all breakpoints
 *
 * @memberof actions/breakpoints
 * @static
 */
export function removeAllBreakpoints(cx) {
  return async (dispatch, getState) => {
    trackEvent("breakpoints.remove_all");

    const breakpointList = getBreakpointsList(getState());
    await Promise.all(breakpointList.map(bp => dispatch(_removeBreakpoint(cx, bp))));
    dispatch({ type: "REMOVE_BREAKPOINTS" });
  };
}

/**
 * Removes breakpoints
 *
 * @memberof actions/breakpoints
 * @static
 */
export function removeBreakpoints(cx, breakpoints) {
  return async dispatch => {
    return Promise.all(breakpoints.map(bp => dispatch(_removeBreakpoint(cx, bp))));
  };
}

export function toggleBreakpointAtLine(cx, line) {
  return (dispatch, getState) => {
    const state = getState();
    const selectedSource = getSelectedSource(state);

    if (!selectedSource) {
      return;
    }

    const bp = getBreakpointAtLocation(state, { column: undefined, line });
    if (bp) {
      return dispatch(_removeBreakpoint(cx, bp));
    }
    return dispatch(
      addBreakpoint(cx, {
        line,
        sourceId: selectedSource.id,
        sourceUrl: selectedSource.url,
      })
    );
  };
}

export function runAnalysisOnLine(line) {
  return (dispatch, getState) => {
    const state = getState();
    const cx = getThreadContext(state);
    const source = getSelectedSource(state);

    if (!source) {
      return;
    }

    const options = { logValue: "dummyValue" };
    const location = {
      column: undefined,
      line,
      sourceId: source.id,
      sourceUrl: source.url,
    };

    return dispatch(runAnalysis(cx, location, options));
  };
}

export function updateHoveredLineNumber(line) {
  return async (dispatch, getState) => {
    const state = getState();
    const source = getSelectedSource(state);

    const initialLocation = {
      column: undefined,
      line,
      sourceId: source.id,
      sourceUrl: source.url,
    };

    // Set the initial location here as a placeholder to be checked after any async activity.
    dispatch(actions.setHoveredLineNumberLocation(initialLocation));

    await dispatch(setBreakpointPositions({ line, sourceId: source.id }));
    const location = getFirstBreakpointPosition(getState(), initialLocation);

    // It's possible that after the `await` above the user is either 1) hovered off of the
    // original line number, or 2) hovered on a different line number altogether. In that
    // case, we should bail.
    if (selectors.getHoveredLineNumberLocation(getState()) !== initialLocation) {
      return;
    }

    dispatch(actions.setHoveredLineNumberLocation(location));
  };
}

export function _addBreakpointAtLine(cx, line, shouldLog = false, disabled = false, shouldPause) {
  return (dispatch, getState) => {
    const state = getState();
    const source = getSelectedSource(state);

    if (!source) {
      return;
    }

    trackEvent("breakpoint.add");

    const breakpointLocation = {
      column: undefined,
      line,
      sourceId: source.id,
      sourceUrl: source.url,
    };

    const options = { shouldPause };

    if (shouldLog) {
      options.logValue = getLogValue(source, state, breakpointLocation);
    }

    return dispatch(addBreakpoint(cx, breakpointLocation, options, disabled));
  };
}

export function addBreakpointAtColumn(cx, location) {
  return (dispatch, getState) => {
    const state = getState();
    const source = getSelectedSource(state);
    const { column, line } = location;

    if (!source) {
      return;
    }
    const breakpointLocation = {
      column: column,
      line: line,
      sourceId: source.id,
      sourceUrl: source.url,
    };

    const options = {
      logValue: getLogValue(source, state, location),
    };

    trackEvent("breakpoint.add_column");

    return dispatch(addBreakpoint(cx, breakpointLocation, options, false));
  };
}

function getLogValue(source, state, location) {
  const file = getFilename(source);
  const symbols = getSymbols(state, source);
  const { line, column } = location;
  const symbol = findClosestEnclosedSymbol(symbols, location);

  if (symbol) {
    return `"${symbol.name}", ${line}`;
  }

  let logValue = `"${file}"`;

  logValue += column ? `, "${line}:${column}"` : `, ${line}`;

  return logValue;
}

export * from "./breakpoints";
export * from "./logpoints";
