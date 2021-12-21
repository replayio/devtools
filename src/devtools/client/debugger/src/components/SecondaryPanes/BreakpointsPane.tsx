import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { getBreakpointSources } from "../../selectors/breakpointSources";
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
  return (
    <Breakpoints
      breakpointSources={breakpointSources}
      onRemoveBreakpoint={removeBreakableBreakpoint}
      onRemoveBreakpoints={removeBreakableBreakpointsInSource}
    />
  );
}

const connector = connect(
  (state: UIState) => ({
    breakpointSources: getBreakpointSources(state),
  }),
  {
    removeBreakableBreakpoint: actions.removeBreakableBreakpoint,
    removeBreakableBreakpointsInSource: actions.removeBreakableBreakpointsInSource,
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(BreakpointsPane);
