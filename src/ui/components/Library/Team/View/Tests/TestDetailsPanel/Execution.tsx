import orderBy from "lodash/orderBy";
import { useRouter } from "next/router";

import { TestExecution } from "shared/test-suites/TestRun";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";

import { getTruncatedRelativeDate } from "../../Recordings/RecordingListItem/RecordingListItem";
import { StatusIcon } from "../../StatusIcon";
import { TestRunRecordingLink } from "./TestDetails";

// This attempts to derive the result for a recording based on the computed
// result for test in the run. We aren't surfacing each execution from the test
// run yet that would provide the correct answer. That will be added by
// SCS-1843.
function getReplayResult(result: string, index: number, total: number) {
  if (result === "passed") {
    return "passed";
  } else if (result === "failed") {
    return "failed";
  } else if (result === "flaky") {
    if (total === 1) {
      // If there's only one replay but the test is flaky,
      // it's cypress and the flake was resolved internally
      return "flaky";
    } else {
      // return passing for the first (last) one, flaky for the rest
      return index === 0 ? "passed" : "flaky";
    }
  } else {
    return result;
  }
}

function ExecutionItem({
  testRunId,
  href,
  children,
}: {
  testRunId: string;
  href?: string;
  children: React.ReactNode;
}) {
  const props = {
    "data-test-run-id": testRunId,
    "data-test-id": "ExecutionItem",
    className: "flex flex-col px-2",
    children,
  };

  if (href) {
    return <a {...props} href={href} />;
  }

  return <div {...props} />;
}

export function Execution({
  execution,
  testRunId,
}: {
  execution: TestExecution;
  testRunId: string;
}) {
  const router = useRouter();
  const title = execution.commitTitle || "<Commit title unavailable>";
  const sortedRecordings = orderBy(execution.recordings, "date", "desc");
  const shouldCollapse = sortedRecordings.length === 1;

  let icon;
  if (shouldCollapse) {
    const recording = sortedRecordings[0];
    icon = (
      <StatusIcon
        status={getReplayResult(execution.result, 0, 1)}
        isProcessed={recording.isProcessed}
      />
    );
  } else {
    icon = <ExecutionStatus result={execution.result} />;
  }

  return (
    <ExecutionItem
      testRunId={testRunId}
      href={
        shouldCollapse
          ? `/recording/${sortedRecordings[0].id}?referrer=${encodeURIComponent(router.asPath)}`
          : undefined
      }
    >
      <div className="flex flex-row items-center justify-between gap-2 overflow-hidden py-2">
        <div className="flex flex-row items-center gap-2 overflow-hidden">
          {icon}
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
        <div className="flex flex-shrink-0 flex-row items-center gap-1 text-xs">
          <div className="flex w-4 items-center">
            <MaterialIcon>schedule</MaterialIcon>
          </div>
          <div data-test-id="ExecutionDate">{getTruncatedRelativeDate(execution.createdAt)}</div>
        </div>
      </div>
      {!shouldCollapse ? (
        <div className="flex flex-col gap-1">
          {sortedRecordings.map((r, i) => (
            <TestRunRecordingLink
              recording={r}
              key={i}
              result={getReplayResult(execution.result, i, execution.recordings.length)}
              attemptNumber={execution.recordings.length - i}
            />
          ))}
        </div>
      ) : null}
    </ExecutionItem>
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
      className="flex flex-row gap-4 overflow-hidden overflow-ellipsis whitespace-nowrap text-xs"
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
