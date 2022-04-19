import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { removeBreakpoint, removeBreakpointsInSource } from "../../actions/breakpoints/breakpoints";
import { Source } from "../../reducers/types";
import { Breakpoint, Context } from "../../selectors";
import { getBreakpointSources } from "../../selectors/breakpointSources";

import Breakpoints from "./Breakpoints";

export default function BreakpointsPane() {
  const breakpointSources = useSelector(getBreakpointSources);
  const dispatch = useDispatch();
  const emptyContent = "Click on a line number in the editor to add a breakpoint";

  return (
    <Breakpoints
      type="breakpoint"
      emptyContent={emptyContent}
      breakpointSources={breakpointSources}
      onRemoveBreakpoint={(cx: Context, breakpoint: Breakpoint) =>
        dispatch(removeBreakpoint(cx, breakpoint))
      }
      onRemoveBreakpoints={(cx: Context, source: Source) =>
        dispatch(removeBreakpointsInSource(cx, source))
      }
    />
  );
}
