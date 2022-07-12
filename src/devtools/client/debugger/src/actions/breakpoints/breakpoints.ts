import { SourceId, Location } from "@replayio/protocol";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import { getFilename } from "devtools/client/debugger/src/utils/source";
import type { UIThunkAction } from "ui/actions";
import { getSelectedSource, SourceDetails } from "ui/reducers/sources";
import type { UIState } from "ui/state";
import { trackEvent } from "ui/utils/telemetry";

import {
  Breakpoint,
  getBreakpointsForSelectedSource,
  getBreakpointsForSource,
} from "../../reducers/breakpoints";
import {
  removeRequestedBreakpoint,
  removeBreakpoints as removeBreakpointsAction,
} from "../../reducers/breakpoints";
import { setBreakpoint } from "../../reducers/breakpoints";
import { PrefixBadge } from "../../reducers/types";
import { getBreakpointsList, getBreakpointAtLocation, getSymbols } from "../../selectors";
import { getRequestedBreakpointLocations } from "../../selectors/breakpoints";
import { findClosestEnclosedSymbol } from "../../utils/ast";
import { isLogpoint } from "../../utils/breakpoint";

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

    dispatch(removeRequestedBreakpoint({ sourceId, line }));
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
      dispatch(removeBreakpointOption(cx, breakpoint, "shouldPause"));
    } else {
      dispatch(_removeBreakpoint(cx, breakpoint));
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

    for (const location of locations) {
      if (location.sourceId === source.id) {
        dispatch(removeRequestedBreakpoint(location));
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
export function removeAllBreakpoints(cx: Context): UIThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    trackEvent("breakpoints.remove_all");

    const breakpointList = getBreakpointsList(getState());
    await Promise.all(breakpointList.map(bp => dispatch(_removeBreakpoint(cx, bp))));
    dispatch(removeBreakpointsAction());
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
    return Promise.all(breakpoints.map(bp => dispatch(_removeBreakpoint(cx, bp))));
  };
}

export function toggleBreakpointAtLine(cx: Context, line: number): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const selectedSource = getSelectedSource(state);

    if (!selectedSource) {
      return;
    }

    const bp = getBreakpointAtLocation(state, { line, column: undefined });
    if (bp) {
      return dispatch(_removeBreakpoint(cx, bp));
    }
    return dispatch(
      addBreakpoint(cx, {
        sourceId: selectedSource.id,
        // @ts-ignore location field mismatches
        sourceUrl: selectedSource.url,
        line,
      })
    );
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
    const state = getState();
    const source = getSelectedSource(state);

    if (!source) {
      return;
    }

    trackEvent("breakpoint.add");

    const breakpointLocation = {
      sourceId: source.id,
      sourceUrl: source.url,
      column: undefined,
      line,
    };

    const options: {
      shouldPause: boolean;
      logValue?: string;
    } = { shouldPause };

    if (shouldLog) {
      // @ts-ignore location field mismatches
      options.logValue = getLogValue(source, state, breakpointLocation);
    }

    // @ts-ignore location field mismatches
    return dispatch(addBreakpoint(cx, breakpointLocation, options, disabled));
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

    return dispatch(addBreakpoint(cx, breakpointLocation, options, false));
  };
}

export function setBreakpointPrefixBadge(
  breakpoint: Breakpoint,
  prefixBadge?: PrefixBadge
): UIThunkAction {
  return (dispatch, getState, { ThreadFront }) => {
    dispatch(
      setBreakpoint(
        {
          ...breakpoint,
          options: { ...breakpoint.options, prefixBadge },
        },
        ThreadFront.recordingId!
      )
    );
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
