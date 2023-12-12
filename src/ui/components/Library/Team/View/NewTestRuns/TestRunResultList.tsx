import { useContext } from "react";

import { TestRunTestWithRecordings } from "shared/test-suites/TestRun";

import { useTestRunDetailsSuspends } from "../TestRuns/hooks/useTestRunDetailsSuspends";
import { Alert } from "./Alert";
import { TestResultListItem } from "./Overview/TestResultListItem";
import { TestRunsContext } from "./TestRunsContextRoot";

export function TestRunResultList({
  selectedSpecTests,
}: {
  selectedSpecTests: TestRunTestWithRecordings[];
}) {
  const { testRunId } = useContext(TestRunsContext);
  const { testRun } = useTestRunDetailsSuspends(testRunId);
  const hasRecordings = selectedSpecTests.some(test =>
    test.executions.some(e => e.recordings.length > 0)
  );

  if (!hasRecordings) {
    return (
      <Alert link="https://docs.replay.io/test-suites">
        No replays were found for this run. They may be outside the retention window or may not have
        been uploaded
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {selectedSpecTests.map(s =>
        s.executions
          .filter(e => e.recordings.length > 0)
          .flatMap(execution =>
            execution.recordings.map(r => (
              <TestResultListItem
                depth={1}
                key={r.id}
                label={execution.result}
                recording={r}
                testRun={testRun}
                test={s}
              />
            ))
          )
      )}
    </div>
  );
}
