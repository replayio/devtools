import React from "react";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { getLogpointSources } from "../../selectors/breakpointSources";
import Breakpoints from "./Breakpoints";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { removeLogpoint, removeLogpointsInSource } from "../../actions/breakpoints/logpoints";

export default function LogpointsPane() {
  const dispatch = useAppDispatch();
  const logpointSources = useAppSelector(getLogpointSources);
  const emptyContent = (
    <>
      {`Click on the `}
      <span className="inline-flex rounded-sm bg-gray-400 text-white">
        <MaterialIcon iconSize="xs">add</MaterialIcon>
      </span>
      {` in the editor to add a print statement`}
    </>
  );

  return (
    <Breakpoints
      type="print-statement"
      emptyContent={emptyContent}
      breakpointSources={logpointSources}
      onRemoveBreakpoint={(cx, breakpoint) => dispatch(removeLogpoint(cx, breakpoint))}
      onRemoveBreakpoints={(cx, source) => dispatch(removeLogpointsInSource(cx, source))}
    />
  );
}
