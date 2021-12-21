import { SourceId } from "@recordreplay/protocol";
import { UIThunkAction } from "ui/actions";
import { trackEvent } from "ui/utils/telemetry";
import { addBreakpointAtLine, Context } from ".";
import {
  Breakpoint,
  getBreakpointsForSource,
  getBreakpointsForSourceId,
} from "../../reducers/breakpoints";
import { Source } from "../../reducers/sources";
import { getRequestedBreakpointLocations } from "../../selectors/breakpoints";
import { isPrintStatement } from "../../utils/breakpoint";
import { removeBreakpoint, removeBreakpointOption, removeRequestedBreakpoint } from "./modify";

export function addBreakableBreakpointAtLine(cx: Context, line: number): UIThunkAction {
  return ({ dispatch, getState }) => {
    const printStatements = getBreakpointsForSourceId(getState());
    const breakpoint = printStatements.find(ps => ps.location.line === line);
    const logValue = isPrintStatement(breakpoint);

    dispatch(addBreakpointAtLine(cx, line, logValue, false, true));
  };
}

export function removeBreakableBreakpointsAtLine(
  cx: Context,
  sourceId: SourceId,
  line: number
): UIThunkAction {
  return ({ dispatch, getState }) => {
    trackEvent("breakpoint.remove");

    dispatch(removeRequestedBreakpoint({ sourceId, line }));
    const breakpoints = getBreakpointsForSource(getState(), sourceId, line);

    breakpoints.map(bp => dispatch(removeBreakableBreakpoint(cx, bp)));
  };
}

export function removeBreakableBreakpoint(cx: Context, breakpoint: Breakpoint): UIThunkAction {
  return async ({ dispatch }) => {
    if (isPrintStatement(breakpoint)) {
      // Keep the breakpoint while removing the log value from its options,
      // so that the print statement remains.
      dispatch(removeBreakpointOption(cx, breakpoint, "breakable"));
    } else {
      dispatch(removeBreakpoint(cx, breakpoint));
    }
  };
}

export function removeBreakableBreakpointsInSource(cx: Context, source: Source): UIThunkAction {
  return async ({ dispatch, getState }) => {
    const breakpoints = getBreakpointsForSource(getState(), source.id);
    for (const breakpoint of breakpoints) {
      dispatch(removeBreakableBreakpoint(cx, breakpoint));
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
