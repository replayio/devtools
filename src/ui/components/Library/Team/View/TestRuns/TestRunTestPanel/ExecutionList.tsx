import { useContext } from "react";

import { TestRunTestWithRecordings } from "shared/test-suites/TestRun";

import { Alert } from "../../shared/Alert";
import { useTestRunDetailsSuspends } from "../hooks/useTestRunDetailsSuspends";
import { TestResultListItem } from "../TestRunDetailsPanel/TestResultListItem";
import { TestRunsContext } from "../TestRunsContextRoot";

export function ExecutionList({ test }: { test: TestRunTestWithRecordings }) {
  const { testRunIdForSuspense } = useContext(TestRunsContext);
  const { testRun } = useTestRunDetailsSuspends(testRunIdForSuspense);
  const noRecordings = test.executions.every(e => e.recordings.length === 0);

  if (noRecordings) {
    return (
      <Alert
        reason="MISSING_REPLAYS_FOR_TEST_RUN"
        link="https://docs.replay.io/test-suites/test-suites-faq#what-causes-replays-to-be-missing-from-the-test-view"
      />
    );
  }

  return (
    <div className="flex flex-col">
      {test.executions
        .filter(e => e.recordings.length > 0)
        .flatMap(execution =>
          execution.recordings.map(r => (
            <TestResultListItem
              depth={1}
              key={r.id}
              label={execution.result}
              recording={r}
              testRun={testRun}
              test={test}
            />
          ))
        )}
    </div>
  );
}
