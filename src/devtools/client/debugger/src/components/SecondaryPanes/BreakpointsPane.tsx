import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { getBreakableBreakpointSources } from "../../selectors/breakpointSources";
import Breakpoints from "./Breakpoints";
import actions from "../../actions";

type PrintStatementsProps = PropsFromRedux & {
  logExceptions: boolean;
};

function BreakpointsPane({
  breakpointSources,
  removeBreakableBreakpoint,
  removeBreakableBreakpointsInSource,
}: PrintStatementsProps) {
  const emptyContent = "Click on a line number in the editor to add a breakpoint";

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
