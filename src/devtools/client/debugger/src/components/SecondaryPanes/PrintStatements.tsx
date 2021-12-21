import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { getPrintStatementSources } from "../../selectors/breakpointSources";
import Breakpoints from "./Breakpoints";
import actions from "../../actions";

type PrintStatementsProps = PropsFromRedux & {
  logExceptions: boolean;
};

function PrintStatements({
  printStatementSources,
  removePrintStatement,
  removePrintStatementsInSource,
}: PrintStatementsProps) {
  const emptyContent = "Click on a line number in the editor to add a breakpoint";

  return (
    <Breakpoints
      type="print-statement"
      emptyContent={emptyContent}
      breakpointSources={printStatementSources}
      onRemoveBreakpoint={removePrintStatement}
      onRemoveBreakpoints={removePrintStatementsInSource}
    />
  );
}

const connector = connect(
  (state: UIState) => ({
    printStatementSources: getPrintStatementSources(state),
  }),
  {
    removePrintStatement: actions.removePrintStatement,
    removePrintStatementsInSource: actions.removePrintStatementsInSource,
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(PrintStatements);
