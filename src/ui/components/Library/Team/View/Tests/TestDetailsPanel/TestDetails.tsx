import orderBy from "lodash/orderBy";

import { Recording } from "shared/graphql/types";
import { GroupedTestRun } from "shared/test-suites/TestRun";
import { trackEvent } from "ui/utils/telemetry";
import { testFailed, testPassed } from "ui/utils/testRuns";

import { StatusIcon } from "../../StatusIcon";
import { Execution } from "./Execution";

export function TestDetails({ testRuns }: { testRuns: GroupedTestRun[] }) {
  const sortedTestRuns = orderBy(testRuns, "date", "desc");

  return (
    <div className="flex flex-col gap-2 py-2">
      {sortedTestRuns.map((t: any) => (
        <TestRun testRun={t} key={t.testRunId} />
      ))}
    </div>
  );
}

function TestRun({ testRun }: { testRun: GroupedTestRun }) {
  const executionsWithReplays = testRun.executions.filter(
    e => e.recordings.length && (testPassed(e) || testFailed(e))
  );

  if (!executionsWithReplays.length) {
    return null;
  }

  const sortedExecutions = orderBy(executionsWithReplays, "createdAt", "desc");

  return (
    <div className="flex flex-col">
      {sortedExecutions.map((e, i) => (
        <Execution execution={e} key={i} testRunId={testRun.testRunId} />
      ))}
    </div>
  );
}

export function TestRunRecordingLink({
  recording,
  result,
  attemptNumber,
}: {
  recording: Pick<Recording, "id" | "title" | "isProcessed">;
  result: string;
  attemptNumber: number;
}) {
  const title = `Attempt ${attemptNumber}`;

  return (
    <a
      href={`/recording/${recording.id}`}
      className="flex flex-row gap-2 pr-4 pl-8"
      onClick={() => trackEvent("test_dashboard.open_replay", { view: "tests", result })}
    >
      <div className="flex flex-row items-center gap-2 overflow-hidden">
        <StatusIcon status={result} isProcessed={recording.isProcessed} />
        <div
          data-test-id="ReplayTitle"
          title={title}
          className="flex-grow overflow-hidden overflow-ellipsis whitespace-nowrap"
        >
          {title}
        </div>
      </div>
    </a>
  );
}
