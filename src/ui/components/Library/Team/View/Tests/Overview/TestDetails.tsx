import { useContext, useEffect, useState } from "react";

import { TestExecution } from "shared/test-suites/TestRun";
import { testFailed, testPassed } from "ui/utils/testRuns";

import { ErrorFrequency } from "../hooks/useTest";
import { TestContext } from "../TestContextRoot";
import { ReplayList } from "./ReplayList";
import { TestErrors } from "./TestErrors";

export const MAX_ERRORS_SHOWN = 5;
export const MAX_REPLAYS_SHOWN = 3;

export function TestDetails({
  errorFrequency,
  executions,
}: {
  errorFrequency: Record<string, ErrorFrequency>;
  executions: TestExecution[];
}) {
  const { testId } = useContext(TestContext);
  const [selectedError, setSelectedError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedError(null);
  }, [testId]);

  return (
    <div>
      {Object.entries(errorFrequency).length ? (
        <TestErrors
          errorFrequency={errorFrequency}
          selectedError={selectedError}
          setSelectedError={setSelectedError}
        />
      ) : null}
      {selectedError ? (
        <ReplayList
          executions={executions.filter(testFailed).filter(e => e.errors?.[0] === selectedError)}
        />
      ) : null}
      <ReplayList executions={executions.filter(testPassed)} />
    </div>
  );
}
