import orderBy from "lodash/orderBy";

import { Recording } from "shared/graphql/types";
import { GroupedTestRun, TestExecution } from "shared/test-suites/TestRun";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { testFailed, testPassed } from "ui/utils/testRuns";

import { getTruncatedRelativeDate } from "../../Recordings/RecordingListItem/RecordingListItem";
import { TestSuitePanelMessage } from "../../TestSuitePanelMessage";
import { StatusIcon } from "./StatusIcon";

// import styles from "./TestRuns.module.css";

export function TestDetails({ testRuns }: { testRuns: GroupedTestRun[] }) {
  const sortedTestRuns = orderBy(testRuns, "date", "desc");

  if (!sortedTestRuns.length) {
    return (
      <div className="flex flex-col gap-1 p-2">
        <TestSuitePanelMessage>No test runs found</TestSuitePanelMessage>;
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
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
    <div className="flex flex-col rounded-md bg-chrome">
      {sortedExecutions.map((e, i) => (
        <Execution execution={e} key={i} />
      ))}
    </div>
  );
}

function getReplayResult(result: string, index: number, total: number) {
  if (result === "passed") {
    return "passed";
  } else if (result === "failed") {
    return "failed";
  } else if (result === "flaky") {
    // return passing for the first (last) one, failing for the rest
    return index === 0 ? "passed" : "failed";
  } else {
    return result;
  }
}

// TODO:Make sure the recordings are sorted by their dates
function Execution({ execution }: { execution: TestExecution }) {
  const title = execution.commitTitle || "<Commit title unavailable>";
  const author = execution.commitAuthor || "<Commit author unavailable>";

  return (
    <div className="flex flex-col">
      <div className="flex flex-row items-center justify-between gap-2 overflow-hidden border-b border-bodyBgcolor py-2 px-4">
        <div className="flex flex-row items-center gap-2 overflow-hidden">
          <ExecutionStatus result={execution.result} />
          <div className="flex flex-col overflow-x-hidden">
            <div title={title} className="flex-grow truncate font-bold">
              {title}
            </div>
            {/* <div className="flex flex-row gap-4 overflow-hidden overflow-ellipsis whitespace-nowrap">
              <div className="flex flex-row items-center gap-1">
                <div className="flex w-4 items-center">
                  <MaterialIcon>person</MaterialIcon>
                </div>
                <div>{author}</div>
              </div>
            </div> */}
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-row items-center gap-1">
          <div className="flex w-4 items-center">
            <MaterialIcon>schedule</MaterialIcon>
          </div>
          <div>{getTruncatedRelativeDate(execution.createdAt)}</div>
        </div>
      </div>
      {execution.recordings.map((r, i) => (
        <Replay
          recording={r}
          key={i}
          result={getReplayResult(execution.result, i, execution.recordings.length)}
          title={`Attempt ${execution.recordings.length - i}`}
        />
      ))}
    </div>
  );
}

function Replay({
  recording,
  result,
  title,
}: {
  recording: Pick<Recording, "id" | "title" | "isProcessed">;
  result: string;
  title: string;
}) {
  return (
    <a
      href={`/recording/${recording.id}`}
      className="flex flex-row gap-2 border-b border-bodyBgcolor py-1 px-4"
    >
      <div className="flex flex-row gap-2 overflow-hidden">
        <StatusIcon status={result} isProcessed={recording.isProcessed} />
        <div className="flex flex-col overflow-x-hidden">
          <div
            title={title}
            className="flex-grow overflow-hidden overflow-ellipsis whitespace-nowrap"
          >
            {title}
          </div>
        </div>
      </div>
    </a>
  );
}

function ExecutionStatus({ result }: { result: string }) {
  let className;
  let icon;

  if (result === "passed") {
    icon = "testsuites-success";
    className = "bg-testsuitesSuccessColor";
  } else if (result === "failed") {
    className = "bg-testsuitesFailedColor";
    icon = "testsuites-v2-failed";
  } else if (result === "flaky") {
    className = "bg-testsuitesFlakyColor";
    icon = "testsuites-v2-flaky";
  } else {
    return null;
  }

  return (
    <div className="flex w-6 flex-shrink-0 flex-col items-center" title={result}>
      <Icon filename={icon} size="medium" className={className} />
    </div>
  );
}
