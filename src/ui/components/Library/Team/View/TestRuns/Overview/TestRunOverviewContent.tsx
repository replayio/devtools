import { useContext } from "react";

import { useTestRunDetailsSuspends } from "ui/components/Library/Team/View/TestRuns/hooks/useTestRunDetailsSuspends";
import { RunResults } from "ui/components/Library/Team/View/TestRuns/Overview/RunResults";
import { TestRunsContext } from "ui/components/Library/Team/View/TestRuns/TestRunsContextRoot";

import { RunSummary } from "./RunSummary";
import styles from "../../../../Library.module.css";

export function TestRunOverviewContent() {
  const { filterByStatus, filterByText, testRunId, testRunIdForDisplay } =
    useContext(TestRunsContext);

  const { testRun, recordings, durationMs } = useTestRunDetailsSuspends(testRunId);

  const isPending = testRunId !== testRunIdForDisplay;

  const hasFilters = filterByStatus !== "all" || filterByText !== "";

  let children = null;
  if (testRun && recordings) {
    if (!hasFilters || testRun) {
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
