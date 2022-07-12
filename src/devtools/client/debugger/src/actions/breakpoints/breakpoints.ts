import { SourceId, Location } from "@replayio/protocol";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import { getFilename } from "devtools/client/debugger/src/utils/source";
import type { UIThunkAction } from "ui/actions";
import { getSelectedSource, SourceDetails } from "ui/reducers/sources";
import type { UIState } from "ui/state";
import { trackEvent } from "ui/utils/telemetry";

import {
  addBreakpoint,
  allBreakpointsRemoved,
  Breakpoint,
  breakpointRemoved,
  getBreakpointsForSelectedSource,
  getBreakpointsForSource,
} from "ui/reducers/breakpoints";
import { PrefixBadge } from "../../reducers/types";
import { getBreakpointsList, getBreakpointAtLocation, getSymbols } from "../../selectors";
import { getRequestedBreakpointLocations } from "../../selectors/breakpoints";
import { findClosestEnclosedSymbol } from "../../utils/ast";
import { isLogpoint } from "../../utils/breakpoint";
import { getPossibleBreakpointsForSource } from "ui/reducers/possibleBreakpoints";
import minBy from "lodash/minBy";

export function addBreakpointAtLine(cx: Context, line: number): UIThunkAction {
  return (dispatch, getState) => {
    const logpoints = getBreakpointsForSelectedSource(getState());
    const breakpoint = logpoints.find(ps => ps.location.line === line);
    const logValue = isLogpoint(breakpoint);

    dispatch(_addBreakpointAtLine(cx, line, logValue, false, true));
  };
}

export function removeBreakpointsAtLine(
  cx: Context,
  sourceId: SourceId,
  line: number
): UIThunkAction {
  return (dispatch, getState) => {
    trackEvent("breakpoint.remove");

    const breakpoints = getBreakpointsForSource(getState(), sourceId, line);

    breakpoints.map(bp => dispatch(removeBreakpoint(cx, bp)));
  };
}

export function removeBreakpoint(
  cx: Context,
  breakpoint: Breakpoint
): UIThunkAction<Promise<void>> {
  return async dispatch => {
    if (isLogpoint(breakpoint)) {
      // Keep the breakpoint while removing the log value from its options,
      // so that the print statement remains.
      // TODO @jcmorrow implement this
      // In general this file could use some cleanup
      // dispatch(removeBreakpointOption(cx, breakpoint, "shouldPause"));
    } else {
      dispatch(breakpointRemoved(breakpoint.location));
    }
  };
}

export function removeBreakpointsInSource(
  cx: Context,
  source: SourceDetails
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const breakpoints = getBreakpointsForSource(getState(), source.id);
    for (const breakpoint of breakpoints) {
      dispatch(removeBreakpoint(cx, breakpoint));
    }

    const requestedBreakpointLocations = getRequestedBreakpointLocations(getState());
    const locations = Object.values(requestedBreakpointLocations);

    const breakpointsToRemove = getBreakpointsForSource(getState(), source.id);
    for (const breakpoint of breakpointsToRemove) {
      dispatch(breakpointRemoved(breakpoint.location));
    }
  };
}

/**
 * Removes all breakpoints
 *
 * @memberof actions/breakpoints
 * @static
 */
export function removeAllBreakpoints(cx: Context): UIThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    trackEvent("breakpoints.remove_all");

    const breakpointList = getBreakpointsList(getState());
    await Promise.all(breakpointList.map(bp => bp && dispatch(breakpointRemoved(bp.location))));
    dispatch(allBreakpointsRemoved());
  };
}

/**
 * Removes breakpoints
 *
 * @memberof actions/breakpoints
 * @static
 */
export function removeBreakpoints(
  cx: Context,
  breakpoints: Breakpoint[]
): UIThunkAction<Promise<void[]>> {
  return async dispatch => {
    return Promise.all(
      breakpoints.map(bp => {
        dispatch(breakpointRemoved(bp.location));
      })
    );
  };
}

export function toggleBreakpointAtLine(line: number): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const selectedSource = getSelectedSource(state);

    if (!selectedSource) {
      return;
    }

    const possibleBreakpoints = getPossibleBreakpointsForSource(state, selectedSource.id)!;
    const column = possibleBreakpoints.find(lineBreakpoint => lineBreakpoint.line === line)
      ?.columns[0];

    if (column === undefined) {
      console.debug(`Impossible to break at requested line: ${line} in ${selectedSource.id}`);
      return;
    }

    const location = {
      sourceId: selectedSource.id,
      line,
      column,
    };

    const bp = getBreakpointAtLocation(state, location);

    if (bp) {
      return dispatch(breakpointRemoved(bp.location));
    }

    const options = {
      logValue: getLogValue(selectedSource, state, location),
    };

    return dispatch(addBreakpoint(location, options));
  };
}

export function _addBreakpointAtLine(
  cx: Context,
  line: number,
  shouldLog = false,
  disabled = false,
  shouldPause: boolean
): UIThunkAction {
  return (dispatch, getState) => {
    trackEvent("breakpoint.add");

    const options: {
      shouldPause: boolean;
      logValue?: string;
    } = { shouldPause };

    return dispatch(toggleBreakpointAtLine(line));
  };
}

export function addBreakpointAtColumn(cx: Context, location: Location): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const source = getSelectedSource(state);
    const { column, line } = location;

    if (!source) {
      return;
    }
    const breakpointLocation = {
      sourceId: source.id,
      sourceUrl: source.url,
      column: column,
      line: line,
    };

    const options = {
      logValue: getLogValue(source, state, location),
    };

    trackEvent("breakpoint.add_column");

    return dispatch(addBreakpoint(breakpointLocation, options));
  };
}

export function setBreakpointPrefixBadge(
  breakpoint: Breakpoint,
  prefixBadge?: PrefixBadge
): UIThunkAction {
  return (dispatch, getState, { ThreadFront }) => {
    // dispatch(
    //   // TODO @jcmorrow Oh yeah, we need this too.
    //   setBreakpoint(
    //     {
    //       ...breakpoint,
    //       options: { ...breakpoint.options, prefixBadge },
    //     },
    //     ThreadFront.recordingId!
    //   )
    // );
  };
}

function getLogValue(source: SourceDetails, state: UIState, location: Location) {
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
