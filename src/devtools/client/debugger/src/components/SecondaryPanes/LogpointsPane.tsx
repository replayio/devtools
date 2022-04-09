import React from "react";
import { useSelector } from "react-redux";
import { getLogpointSources } from "../../selectors/breakpointSources";
import Breakpoints from "./Breakpoints";
import MaterialIcon from "ui/components/shared/MaterialIcon";

export default function LogpointsPane() {
  const logpointSources = useSelector(getLogpointSources);
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
    />
  );
}
