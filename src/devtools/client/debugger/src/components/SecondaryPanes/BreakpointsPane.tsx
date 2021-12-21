import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { getBreakableBreakpointSources } from "../../selectors/breakpointSources";
import Breakpoints from "./Breakpoints";
import actions from "../../actions";
import MaterialIcon from "ui/components/shared/MaterialIcon";

type PrintStatementsProps = PropsFromRedux & {
  logExceptions: boolean;
};

function BreakpointsPane({
  breakpointSources,
  removeBreakableBreakpoint,
  removeBreakableBreakpointsInSource,
}: PrintStatementsProps) {
  const emptyContent = (
    <>
      <span>{`Hover over a line in the editor and click on `}</span>
      <span className="bg-primaryAccent inline-flex rounded-sm text-white">
        <MaterialIcon iconSize="xs">add</MaterialIcon>
      </span>
      <span>{` to add a print statement`}</span>
    </>
  );

  return (
    <Breakpoints
      type="breakpoint"
      emptyContent={emptyContent}
      breakpointSources={breakpointSources}
      onRemoveBreakpoint={removeBreakableBreakpoint}
      onRemoveBreakpoints={removeBreakableBreakpointsInSource}
    />
  );
}

const connector = connect(
  (state: UIState) => ({
    breakpointSources: getBreakableBreakpointSources(state),
  }),
  {
    removeBreakableBreakpoint: actions.removeBreakableBreakpoint,
    removeBreakableBreakpointsInSource: actions.removeBreakableBreakpointsInSource,
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(BreakpointsPane);
