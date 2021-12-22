import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { getLogpointSources } from "../../selectors/breakpointSources";
import Breakpoints from "./Breakpoints";
import actions from "../../actions";
import MaterialIcon from "ui/components/shared/MaterialIcon";

type LogpointsProps = PropsFromRedux & {
  logExceptions: boolean;
};

function LogpointsPane({
  logpointSources,
  removeLogpoint,
  removeLogpointsInSource,
}: LogpointsProps) {
  const emptyContent = (
    <>
      {`Hover over a line in the editor and click on `}
      <span className="bg-primaryAccent inline-flex rounded-sm text-white">
        <MaterialIcon iconSize="xs">add</MaterialIcon>
      </span>
      {` to add a print statement`}
    </>
  );

  return (
    <Breakpoints
      type="print-statement"
      emptyContent={emptyContent}
      breakpointSources={logpointSources}
      onRemoveBreakpoint={removeLogpoint}
      onRemoveBreakpoints={removeLogpointsInSource}
    />
  );
}

const connector = connect(
  (state: UIState) => ({
    logpointSources: getLogpointSources(state),
  }),
  {
    removeLogpoint: actions.removeLogpoint,
    removeLogpointsInSource: actions.removeLogpointsInSource,
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(LogpointsPane);
