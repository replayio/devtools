import { SourceId, Location } from "@replayio/protocol";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import { getFilename } from "devtools/client/debugger/src/utils/source";
import type { UIThunkAction } from "ui/actions";
import { selectors } from "ui/reducers";
import { setHoveredLineNumberLocation } from "ui/reducers/app";
import { fetchPossibleBreakpointsForSource } from "ui/reducers/possibleBreakpoints";
import type { MiniSource, SourceDetails } from "ui/reducers/sources";
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
import {
  getBreakpointsList,
  getBreakpointAtLocation,
  getFirstBreakpointPosition,
  getSymbols,
} from "../../selectors";
import { getSelectedSource } from "ui/reducers/sources";
import { getRequestedBreakpointLocations } from "../../selectors/breakpoints";
import { findClosestEnclosedSymbol } from "../../utils/ast";
import { isLogpoint } from "../../utils/breakpoint";

import {
  _removeBreakpoint,
  removeBreakpointOption,
  addBreakpoint,
  enableBreakpoint,
  disableBreakpoint,
  runAnalysis,
} from "./modify";

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
      dispatch(removeBreakpointOption(cx, breakpoint, "shouldPause"));
    } else {
      dispatch(_removeBreakpoint(cx, breakpoint));
    }
  };
}

export function removeBreakpointsInSource(
  cx: Context,
  source: MiniSource
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
 * Disable all breakpoints in a source
 *
 * @memberof actions/breakpoints
 * @static
 */
export function disableBreakpointsInSource(
  cx: Context,
  source: SourceDetails
): UIThunkAction<Promise<void>> {
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
export function enableBreakpointsInSource(
  cx: Context,
  source: SourceDetails
): UIThunkAction<Promise<void>> {
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
export function removeAllBreakpoints(cx: Context): UIThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    trackEvent("breakpoints.remove_all");

    const breakpointList = getBreakpointsList(getState());
    await Promise.all(
      breakpointList.map(bp => {
        dispatch(_removeBreakpoint(cx, bp));
      })
    );
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
        sourceUrl: selectedSource.url!,
        line,
        column: 0,
      })
    );
  };
}

export function updateHoveredLineNumber(line: number): UIThunkAction<Promise<void>> {
  // if you are hovering a line or a print statement panel that has hits, we
  // will show those hits on the global timeline. In order to do that, we need
  // to store the editor's hovered line number in global state.
  return async (dispatch, getState) => {
    const state = getState();
    const source = getSelectedSource(state)!;

    const initialLocation = {
      sourceId: source.id,
      sourceUrl: source.url,
      column: undefined,
      line,
    };

    // Set the initial location here as a placeholder to be checked after any async activity.
    // @ts-ignore Location field mismatches
    dispatch(setHoveredLineNumberLocation(initialLocation));

    await dispatch(fetchPossibleBreakpointsForSource(source.id));
    const location = getFirstBreakpointPosition(getState(), initialLocation);

    // It's possible that after the `await` above the user is either 1) hovered off of the
    // original line number, or 2) hovered on a different line number altogether. In that
    // case, we should bail.
    // @ts-ignore Types don't overlap
    if (selectors.getHoveredLineNumberLocation(getState()) !== initialLocation) {
      return;
    }

    dispatch(setHoveredLineNumberLocation(location!));
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

    // @ts-expect-error Breakpoint location field mismatches
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
