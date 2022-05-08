import { UIThunkAction } from "ui/actions";
import { trackEvent } from "ui/utils/telemetry";
import { Breakpoint, getBreakpointsForSourceId } from "../../reducers/breakpoints";
import { getLogpointsForSource } from "../../reducers/breakpoints";
import { Source } from "../../reducers/sources";
import { getRequestedBreakpointLocations } from "../../selectors/breakpoints";
import { isBreakable } from "../../utils/breakpoint";
import { _removeBreakpoint, removeBreakpointOption, removeRequestedBreakpoint } from "./modify";

import { _addBreakpointAtLine } from "./breakpoints";
import type { Context } from "devtools/client/debugger/src/reducers/pause";

export function removeLogpointsInSource(cx: Context, source: Source): UIThunkAction {
  return async (dispatch, getState) => {
    const breakpoints = getLogpointsForSource(getState(), source.id);
    for (const breakpoint of breakpoints) {
      dispatch(removeLogpoint(cx, breakpoint));
    }
    const requestedBreakpointLocations = getRequestedBreakpointLocations(getState());
    for (const location of Object.values(requestedBreakpointLocations)) {
      if (location.sourceId === source.id) {
        dispatch(removeRequestedBreakpoint(location));
      }
    }
  };
}

export function toggleLogpoint(cx: Context, line: number, bp?: Breakpoint): UIThunkAction {
  return dispatch => {
    if (bp?.options.logValue) {
      trackEvent("breakpoint.minus_click");
      return dispatch(removeLogpoint(cx, bp));
    }

    trackEvent("breakpoint.plus_click");
    return dispatch(addLogpoint(cx, line));
  };
}

export function addLogpoint(cx: Context, line: number): UIThunkAction {
  return (dispatch, getState) => {
    const logpoints = getBreakpointsForSourceId(getState());
    const breakpoint = logpoints.find(ps => ps.location.line === line);
    const shouldPause = isBreakable(breakpoint);

    dispatch(_addBreakpointAtLine(cx, line, true, false, shouldPause));
  };
}

export function removeLogpoint(cx: Context, bp: Breakpoint): UIThunkAction {
  return dispatch => {
    if (isBreakable(bp)) {
      // Keep the breakpoint while removing the log value from its options,
      // so that the breakable breakpoint remains.
      dispatch(removeBreakpointOption(cx, bp, "logValue"));
    } else {
      dispatch(_removeBreakpoint(cx, bp));
    }
  };
}
