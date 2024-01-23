import { useContext, useState } from "react";

import { TestSuitePanelMessage } from "../../TestSuitePanelMessage";
import { useTestRunDetailsSuspends } from "../hooks/useTestRunDetailsSuspends";
import { TestRunPanelWrapper } from "../TestRunPanelWrapper";
import { TestRunsContext } from "../TestRunsContextRoot";
import { RunResults } from "./RunResults";
import { RunSummary } from "./RunSummary";

export function TestRunDetailsPanel() {
  const { testRunIdForSuspense: testRunId, testRuns } = useContext(TestRunsContext);

  const { durationMs } = useTestRunDetailsSuspends(testRunId);
  const [filterCurrentRunByStatus, setFilterCurrentRunByStatus] = useState<
    "all" | "failed-and-flaky"
  >("all");

  const testRun = testRuns.find(testRun => testRun.id === testRunId);

  let children = null;
  if (testRun) {
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
