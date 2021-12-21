import { UIThunkAction } from "ui/actions";
import { trackEvent } from "ui/utils/telemetry";
import { addBreakpointAtLine, Context } from ".";
import { Breakpoint, getBreakpointsForSourceId } from "../../reducers/breakpoints";
import { getPrintStatementsForSource } from "../../reducers/breakpoints/print-statements";
import { Source } from "../../reducers/sources";
import { getRequestedBreakpointLocations } from "../../selectors/breakpoints";
import { isBreakable } from "../../utils/breakpoint";
import { removeBreakpoint, removeBreakpointOption, removeRequestedBreakpoint } from "./modify";

export function removePrintStatementsInSource(cx: Context, source: Source): UIThunkAction {
  return async ({ dispatch, getState }) => {
    const breakpoints = getPrintStatementsForSource(getState(), source.id);
    for (const breakpoint of breakpoints) {
      dispatch(removePrintStatement(cx, breakpoint));
    }
    const requestedBreakpointLocations = getRequestedBreakpointLocations(getState());
    for (const location of Object.values(requestedBreakpointLocations)) {
      if (location.sourceId === source.id) {
        dispatch(removeRequestedBreakpoint(location));
      }
    }
  };
}

export function togglePrintStatement(cx: Context, line: number, bp?: Breakpoint): UIThunkAction {
  return ({ dispatch }) => {
    console.log("1");
    if (bp?.options.logValue) {
      console.log("2");
      trackEvent("breakpoint.minus_click");
      return dispatch(removePrintStatement(cx, bp));
    }

    console.log("3");
    trackEvent("breakpoint.plus_click");
    return dispatch(addPrintStatement(cx, line));
  };
}

function addPrintStatement(cx: Context, line: number): UIThunkAction {
  return ({ dispatch, getState }) => {
    const printStatements = getBreakpointsForSourceId(getState());
    const breakpoint = printStatements.find(ps => ps.location.line === line);
    const breakable = !!isBreakable(breakpoint);

    dispatch(addBreakpointAtLine(cx, line, true, false, breakable));
  };
}

export function removePrintStatement(cx: Context, bp: Breakpoint): UIThunkAction {
  return ({ dispatch }) => {
    if (isBreakable(bp)) {
      // Keep the breakpoint while removing the log value from its options,
      // so that the breakable breakpoint remains.
      dispatch(removeBreakpointOption(cx, bp, "logValue"));
    } else {
      dispatch(removeBreakpoint(cx, bp));
    }
  };
}
