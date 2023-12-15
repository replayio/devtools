import { useContext } from "react";

import { TestRunTestWithRecordings } from "shared/test-suites/TestRun";

import { Alert, AlertType } from "../shared/Alert";
import { useTestRunDetailsSuspends } from "../TestRuns/hooks/useTestRunDetailsSuspends";
import { TestResultListItem } from "./Overview/TestResultListItem";
import { TestRunsContext } from "./TestRunsContextRoot";

export function TestRunResultList({
  selectedSpecTests,
}: {
  selectedSpecTests: TestRunTestWithRecordings[];
}) {
  const { testRunId } = useContext(TestRunsContext);
  const { testRun } = useTestRunDetailsSuspends(testRunId);
  const noRecordings = selectedSpecTests.every(test =>
    test.executions.every(e => e.recordings.length === 0)
  );

  if (noRecordings) {
    return (
      <Alert
        reason={AlertType.MISSING_REPLAYS_FOR_TEST_RUN}
        link="https://docs.replay.io/test-suites"
      />
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
