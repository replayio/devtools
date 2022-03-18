import { SourceId } from "@recordreplay/protocol";
import { UIThunkAction } from "ui/actions";
import { trackEvent } from "ui/utils/telemetry";
import { _addBreakpointAtLine, Context } from ".";
import {
  Breakpoint,
  getBreakpointsForSource,
  getBreakpointsForSourceId,
} from "../../reducers/breakpoints";
import { Source } from "../../reducers/sources";
import { getRequestedBreakpointLocations } from "../../selectors/breakpoints";
import { isLogpoint } from "../../utils/breakpoint";
import { _removeBreakpoint, removeBreakpointOption, removeRequestedBreakpoint } from "./modify";

export function addBreakpointAtLine(cx: Context, line: number): UIThunkAction {
  return (dispatch, getState) => {
    const logpoints = getBreakpointsForSourceId(getState());
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

export function removeBreakpoint(cx: Context, breakpoint: Breakpoint): UIThunkAction {
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

export function removeBreakpointsInSource(cx: Context, source: Source): UIThunkAction {
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
