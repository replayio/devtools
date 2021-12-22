import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { getBreakpointSources } from "../../selectors/breakpointSources";
import Breakpoints from "./Breakpoints";
import actions from "../../actions";

type LogpointsProps = PropsFromRedux & {
  logExceptions: boolean;
};

function BreakpointsPane({
  breakpointSources,
  removeBreakpoint,
  removeBreakpointsInSource,
}: LogpointsProps) {
  const emptyContent = "Click on a line number in the editor to add a breakpoint";

  return (
    <Breakpoints
      type="breakpoint"
      emptyContent={emptyContent}
      breakpointSources={breakpointSources}
      onRemoveBreakpoint={removeBreakpoint}
      onRemoveBreakpoints={removeBreakpointsInSource}
    />
  );
}

const connector = connect(
  (state: UIState) => ({
    breakpointSources: getBreakpointSources(state),
  }),
  {
    removeBreakpoint: actions.removeBreakpoint,
    removeBreakpointsInSource: actions.removeBreakpointsInSource,
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(BreakpointsPane);
