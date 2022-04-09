import React from "react";
import { useSelector } from "react-redux";
import { getBreakpointSources } from "../../selectors/breakpointSources";
import Breakpoints from "./Breakpoints";

export default function BreakpointsPane() {
  const breakpointSources = useSelector(getBreakpointSources);
  const emptyContent = "Click on a line number in the editor to add a breakpoint";

  return (
    <Breakpoints
      type="breakpoint"
      emptyContent={emptyContent}
      breakpointSources={breakpointSources}
    />
  );
}
