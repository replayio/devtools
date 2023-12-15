import { useContext, useEffect, useState } from "react";

import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import { RunResults } from "ui/components/Library/Team/View/NewTestRuns/Overview/RunResults";
import { TestRunsContext } from "ui/components/Library/Team/View/NewTestRuns/TestRunsContextRoot";
import { useTestRunDetailsSuspends } from "ui/components/Library/Team/View/TestRuns/hooks/useTestRunDetailsSuspends";

import { TestSuitePanelMessage } from "../../TestSuitePanelMessage";
import { RunSummary } from "./RunSummary";
import styles from "../../../../Library.module.css";

export function TestRunOverviewContent() {
  const {
    testRunsLoading,
    testRunId,
    testRunIdForDisplay,
    testRuns,
    filterTestsByText,
    setFilterTestsByText,
  } = useContext(TestRunsContext);

  const { recordings, durationMs } = useTestRunDetailsSuspends(testRunId);
  const [filterCurrentRunByStatus, setFilterCurrentRunByStatus] = useState<
    "all" | "failed-and-flaky"
  >("all");

  const isLoadingFromBlank = testRunsLoading || (!testRunId && !recordings && testRuns.length > 0);
  const isPending = testRunId !== testRunIdForDisplay;

  const testRun = testRuns.find(testRun => testRun.id === testRunId);

  let children = null;

  if (isLoadingFromBlank) {
    return <LibrarySpinner />;
  }

  if (testRun) {
    children = (
      <>
        <RunSummary
          isPending={isPending}
          testRun={testRun}
          durationMs={durationMs}
          setTestFilterByText={setFilterTestsByText}
          testFilterByText={filterTestsByText}
          setFilterCurrentRunByStatus={setFilterCurrentRunByStatus}
          filterCurrentRunByStatus={filterCurrentRunByStatus}
        />
        <RunResults
          isPending={isPending}
          testFilterByText={filterTestsByText}
          filterCurrentRunByStatus={filterCurrentRunByStatus}
        />
      </>
    );
  } else if (!recordings?.length) {
    children = <TestSuitePanelMessage>Zero results</TestSuitePanelMessage>;
  } else {
    children = <TestSuitePanelMessage>Select a run to see its details here</TestSuitePanelMessage>;
  }

  return (
    <div className={`flex h-full w-full flex-col p-2 text-sm transition ${styles.runOverview}`}>
      {children}
    </div>
  );
}
