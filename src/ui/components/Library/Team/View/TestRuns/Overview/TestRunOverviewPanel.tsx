import { useContext, useEffect, useState } from "react";

import { useTestRunDetailsSuspends } from "ui/components/Library/Team/View/TestRuns/hooks/useTestRunDetailsSuspends";
import { RunResults } from "ui/components/Library/Team/View/TestRuns/Overview/RunResults";
import { TestRunsContext } from "ui/components/Library/Team/View/TestRuns/TestRunsContextRoot";

import { TestSuitePanelMessage } from "../../TestSuitePanelMessage";
import { TestRunPanelWrapper } from "../TestRunPanelWrapper";
import { RunSummary } from "./RunSummary";

export function TestRunOverviewPanel() {
  const { testRunId, testRuns, filterTestsByText, setFilterTestsByText } =
    useContext(TestRunsContext);

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
          setTestFilterByText={setFilterTestsByText}
          testFilterByText={filterTestsByText}
          setFilterCurrentRunByStatus={setFilterCurrentRunByStatus}
          filterCurrentRunByStatus={filterCurrentRunByStatus}
        />
        <RunResults
          testFilterByText={filterTestsByText}
          filterCurrentRunByStatus={filterCurrentRunByStatus}
        />
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
