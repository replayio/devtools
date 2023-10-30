import { useContext } from "react";

import { useTestRunRecordingsSuspends } from "ui/components/Library/Team/View/TestRuns/hooks/useTestRunRecordingsSuspends";
import { RunResults } from "ui/components/Library/Team/View/TestRuns/Overview/RunResults";
import { TestRunsContext } from "ui/components/Library/Team/View/TestRuns/TestRunsContextRoot";

import { RunSummary } from "./RunSummary";
import styles from "../../../../Library.module.css";

export function TestRunOverviewContent() {
  const { filterByStatus, filterByText, testRunId, testRunIdForDisplay, testRuns } =
    useContext(TestRunsContext);

  const { recordings, durationMs } = useTestRunRecordingsSuspends(testRunId);

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
            recordings={recordings}
            testRun={testRun}
            durationMs={durationMs}
          />
          <RunResults isPending={isPending} />
        </>
      );
    }
  }

  return (
    <div className={`flex h-full flex-col text-sm transition ${styles.runOverview} `}>
      {children}
    </div>
  );
}
