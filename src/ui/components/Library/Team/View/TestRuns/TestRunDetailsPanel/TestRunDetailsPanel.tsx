import { useContext, useState } from "react";

import { filterTestRun } from "shared/test-suites/TestRun";

import { TestSuitePanelMessage } from "../../TestSuitePanelMessage";
import { useTestRunDetailsSuspends } from "../hooks/useTestRunDetailsSuspends";
import { TestRunPanelWrapper } from "../TestRunPanelWrapper";
import { TestRunsContext } from "../TestRunsContextRoot";
import { RunResults } from "./RunResults";
import { RunSummary } from "./RunSummary";

export function TestRunDetailsPanel() {
  const { testRunIdForSuspense, filterByText, filterByBranch, filterByStatus } =
    useContext(TestRunsContext);

  const { durationMs, testRun } = useTestRunDetailsSuspends(testRunIdForSuspense);
  const [filterCurrentRunByStatus, setFilterCurrentRunByStatus] = useState<
    "all" | "failed-and-flaky"
  >("all");

  let children = null;
  if (
    testRun &&
    filterTestRun(testRun, { branch: filterByBranch, status: filterByStatus, text: filterByText })
  ) {
    children = (
      <>
        <RunSummary
          testRun={testRun}
          durationMs={durationMs}
          setFilterCurrentRunByStatus={setFilterCurrentRunByStatus}
          filterCurrentRunByStatus={filterCurrentRunByStatus}
        />
        <RunResults filterCurrentRunByStatus={filterCurrentRunByStatus} />
      </>
    );
  } else {
    children = (
      <TestSuitePanelMessage data-test-id="NoTestRunSelected">
        Select a run to see its details here
      </TestSuitePanelMessage>
    );
  }

  return <TestRunPanelWrapper>{children}</TestRunPanelWrapper>;
}
