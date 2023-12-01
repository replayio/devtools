import { TestExecution } from "shared/test-suites/TestRun";
import { testFailed, testPassed } from "ui/utils/testRuns";

import { ReplayList } from "./ReplayList";

export function TestDetails({ executions }: { executions: TestExecution[] }) {
  return (
    <ReplayList
      label="Replays"
      executions={executions.filter(e => testPassed(e) || testFailed(e))}
    />
  );
}
