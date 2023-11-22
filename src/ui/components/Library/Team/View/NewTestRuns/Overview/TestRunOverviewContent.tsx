import { useContext, useEffect, useState } from "react";

import { useTestRunDetailsSuspends } from "ui/components/Library/Team/View/NewTestRuns/hooks/useTestRunDetailsSuspends";
import { RunResults } from "ui/components/Library/Team/View/NewTestRuns/Overview/RunResults";
import { TestRunsContext } from "ui/components/Library/Team/View/NewTestRuns/TestRunsContextRoot";

import { RunSummary } from "./RunSummary";
import styles from "../../../../Library.module.css";

export function TestRunOverviewContent() {
  const { filterByStatus, filterByText, testRunId, testRunIdForDisplay, testRuns } =
    useContext(TestRunsContext);

  const { recordings, durationMs } = useTestRunDetailsSuspends(testRunId);
  const [testFilterByText, setTestFilterByText] = useState("");

  useEffect(() => {
    setTestFilterByText("");
  }, [testRunId]);

  const isPending = testRunId !== testRunIdForDisplay;

  const hasFilters = filterByStatus !== "all" || filterByText !== "";
  const testRun = testRuns.find(testRun => testRun.id === testRunId);

  let children = null;
  if (testRun && recordings) {
    if (!hasFilters || testRuns.find(testRun => testRun.id === testRunId)) {
      children = (
        <>
          <RunSummary
            isPending={isPending}
            testRun={testRun}
            durationMs={durationMs}
            setTestFilterByText={setTestFilterByText}
            testFilterByText={testFilterByText}
          />
          <RunResults isPending={isPending} testFilterByText={testFilterByText} />
        </>
      );
    }
  }

  return (
    <div className={`flex h-full flex-col p-2 text-sm transition ${styles.runOverview}`}>
      {children}
    </div>
  );
}
