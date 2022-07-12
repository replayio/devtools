import type { Context } from "devtools/client/debugger/src/reducers/pause";
import { UIThunkAction } from "ui/actions";
import { trackEvent } from "ui/utils/telemetry";
import { SourceDetails } from "ui/reducers/sources";

import { isBreakable } from "../../utils/breakpoint";

import { _addBreakpointAtLine } from "./breakpoints";
import { getBreakpointsForSelectedSource, getLogpointsForSource } from "ui/reducers/breakpoints";
import { Breakpoint } from "../../reducers/types";

export function removeLogpointsInSource(cx: Context, source: SourceDetails): UIThunkAction {
  return async (dispatch, getState) => {
    const breakpoints = getLogpointsForSource(getState(), source.id);
    for (const breakpoint of breakpoints) {
      dispatch(removeLogpoint(cx, breakpoint));
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
    const logpoints = getBreakpointsForSelectedSource(getState());
    const breakpoint = logpoints.find(ps => ps.location.line === line);
    const shouldPause = isBreakable(breakpoint);

    dispatch(_addBreakpointAtLine(cx, line, true, false, shouldPause));
  };
}

export function removeLogpoint(cx: Context, bp: Breakpoint): UIThunkAction {
  // TODO @jcmorrow fix this.
  return dispatch => {
    if (isBreakable(bp)) {
      // Keep the breakpoint while removing the log value from its options,
      // so that the breakable breakpoint remains.
      // dispatch(removeBreakpointOption(cx, bp, "logValue"));
    } else {
      // dispatch(removeBreakpoint(cx, bp));
    }
  };
}
