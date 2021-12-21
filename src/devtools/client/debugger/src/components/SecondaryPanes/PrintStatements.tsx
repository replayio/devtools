import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { getPrintStatementSources } from "../../selectors/breakpointSources";
import Breakpoints from "./Breakpoints";
import actions from "../../actions";
import MaterialIcon from "ui/components/shared/MaterialIcon";

type PrintStatementsProps = PropsFromRedux & {
  logExceptions: boolean;
};

function PrintStatements({
  printStatementSources,
  removePrintStatement,
  removePrintStatementsInSource,
}: PrintStatementsProps) {
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
