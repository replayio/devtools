import React from "react";
import { MiniSource } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { removeBreakpoint, removeBreakpointsInSource } from "../../actions/breakpoints/breakpoints";
import { Breakpoint, Context } from "../../selectors";
import { getBreakpointSources } from "../../selectors/breakpointSources";
import Breakpoints from "./Breakpoints";

export default function BreakpointsPane() {
  const breakpointSources = useAppSelector(getBreakpointSources);
  const dispatch = useAppDispatch();
  const emptyContent = "Click on a line number in the editor to add a breakpoint";

  return (
    <Breakpoints
      type="breakpoint"
      emptyContent={emptyContent}
      breakpointSources={breakpointSources}
      onRemoveBreakpoint={(cx: Context, breakpoint: Breakpoint) =>
        dispatch(removeBreakpoint(cx, breakpoint))
      }
      onRemoveBreakpoints={(cx, source) => dispatch(removeBreakpointsInSource(cx, source))}
    />
  );
}
