import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLogpointSources } from "../../selectors/breakpointSources";
import Breakpoints from "./Breakpoints";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { removeLogpoint, removeLogpointsInSource } from "../../actions/breakpoints/logpoints";
import { Context } from "../../selectors";
import { Breakpoint, Source } from "../../reducers/types";

export default function LogpointsPane() {
  const dispatch = useDispatch();
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
      onRemoveBreakpoint={(cx: Context, breakpoint: Breakpoint) =>
        dispatch(removeLogpoint(cx, breakpoint))
      }
      onRemoveBreakpoints={(cx: Context, source: Source) =>
        dispatch(removeLogpointsInSource(cx, source))
      }
    />
  );
}
