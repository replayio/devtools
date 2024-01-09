import orderBy from "lodash/orderBy";

import { TestExecution } from "shared/test-suites/TestRun";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";

import { getTruncatedRelativeDate } from "../../Recordings/RecordingListItem/RecordingListItem";
import { Replay, getReplayResult } from "./TestDetails";

export function Execution({ execution }: { execution: TestExecution }) {
  const title = execution.commitTitle || "<Commit title unavailable>";
  const sortedRecordings = orderBy(execution.recordings, "date", "desc");

  return (
    <div data-test-id="ExecutionItem" className="flex flex-col">
      <div className="flex flex-row items-center justify-between gap-2 overflow-hidden border-b border-bodyBgcolor py-2 px-4">
        <div className="flex flex-row items-center gap-2 overflow-hidden">
          <ExecutionStatus result={execution.result} />
          <div className="flex flex-col overflow-x-hidden">
            <div
              data-test-id="ExecutionTitle"
              title={title}
              className="flex-grow truncate font-bold"
            >
              {title}
            </div>
            {execution.commitAuthor ? <CommitAuthor author={execution.commitAuthor} /> : null}
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-row items-center gap-1">
          <div className="flex w-4 items-center">
            <MaterialIcon>schedule</MaterialIcon>
          </div>
          <div data-test-id="ExecutionDate">{getTruncatedRelativeDate(execution.createdAt)}</div>
        </div>
      </div>
      {sortedRecordings.map((r, i) => (
        <Replay
          recording={r}
          key={i}
          result={getReplayResult(execution.result, i, execution.recordings.length)}
          attemptNumber={execution.recordings.length - i}
        />
      ))}
    </div>
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
    <div
      data-test-id="ExecutionStatusIcon"
      className="flex h-6 w-6 flex-shrink-0 flex-col items-center justify-center"
      title={result}
    >
      <Icon filename={icon} size="medium" className={className} />
    </div>
  );
}

export function CommitAuthor({ author }: { author: string }) {
  return (
    <div
      data-test-id="CommitAuthor"
      className="flex flex-row gap-4 overflow-hidden overflow-ellipsis whitespace-nowrap"
    >
      <div className="flex flex-row items-center gap-1">
        <div className="flex w-4 items-center">
          <MaterialIcon>person</MaterialIcon>
        </div>
        <div>{author}</div>
      </div>
    </div>
  );
}
