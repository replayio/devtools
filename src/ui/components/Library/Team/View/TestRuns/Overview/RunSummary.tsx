import { captureException } from "@sentry/react";
import Link from "next/link";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { TestRun, getTestRunTitle } from "shared/test-suites/TestRun";
import { AttributeContainer } from "ui/components/Library/Team/View/TestRuns/AttributeContainer";
import { BranchIcon } from "ui/components/Library/Team/View/TestRuns/BranchIcon";
import { RunStats } from "ui/components/Library/Team/View/TestRuns/RunStats";

import {
  getDurationString,
  getTruncatedRelativeDate,
} from "../../Recordings/RecordingListItem/RecordingListItem";
import { useTestRunDetailsSuspends } from "../../TestRuns/hooks/useTestRunDetailsSuspends";
import { Dropdown } from "../Dropdown";
import { FilterField } from "../FilterField";

function ModeAttribute({ testRun }: { testRun: TestRun }) {
  const { mode } = testRun;

  let modeIcon = null;
  let modeText = null;

  if (mode !== null) {
    switch (mode) {
      case "diagnostics":
        modeIcon = "biotech";
        modeText = "Diagnostic Mode";
        break;
      case "stress":
        modeIcon = "repeat";
        modeText = "Stress Test Mode";
        break;
      case "record-on-retry":
        modeIcon = "repeatone";
        modeText = "Record on Retry Mode";
        break;
      case "record":
        break;
      default:
        // Fallback in case of unexpected Test Suites metadata values
        captureException(new Error(`Unexpected test run mode "${mode}"`).stack, {
          extra: { mode },
        });
        break;
    }
  }

  if (modeIcon == null && modeText == null) {
    return null;
  }

  return <AttributeContainer icon={modeIcon}>{modeText}</AttributeContainer>;
}

function RunnerLink({ testRun }: { testRun: TestRun }) {
  if (!testRun.source?.triggerUrl) {
    return null;
  }

  return (
    <Link
      data-test-id="TestRun-WorkflowLink"
      href={testRun.source.triggerUrl}
      target="_blank"
      rel="noreferrer noopener"
      className="flex flex-row items-center gap-1 hover:underline"
    >
      <Icon className="h-4 w-4" type="open" />
      <span>Workflow</span>
    </Link>
  );
}

export function Attributes({ testRun, durationMs }: { testRun: TestRun; durationMs: number }) {
  const { date, source } = testRun;

  const durationString = getDurationString(durationMs);

  if (source) {
    const { branchName, isPrimaryBranch, user } = source;

    return (
      <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2">
        <AttributeContainer dataTestId="TestRun-Date" icon="schedule" title={date.toLocaleString()}>
          {getTruncatedRelativeDate(date)}
        </AttributeContainer>
        {user ? (
          <AttributeContainer dataTestId="TestRun-Username" icon="person">
            {user}
          </AttributeContainer>
        ) : null}
        {branchName ? (
          <BranchIcon
            branchName={branchName}
            isPrimaryBranch={isPrimaryBranch ?? false}
            title={getTestRunTitle(testRun)}
          />
        ) : null}
        <AttributeContainer dataTestId="TestRun-Duration" icon="timer">
          {durationString}
        </AttributeContainer>
        <ModeAttribute testRun={testRun} />
        <PullRequestLink testRun={testRun} />
        <RunnerLink testRun={testRun} />
      </div>
    );
  } else {
    return (
      <div className="flex flex-row flex-wrap items-center gap-2 pl-1">
        <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
      </div>
    );
  }
}

function PullRequestLink({ testRun }: { testRun: TestRun }) {
  const { source } = testRun;
  if (!source) {
    return null;
  }

  const { prNumber, repository } = source;
  if (!prNumber || !repository) {
    return null;
  }

  return (
    <Link
      href={`https://github.com/${repository}/pull/${prNumber}`}
      target="_blank"
      rel="noreferrer noopener"
      className="flex flex-row items-center gap-1 hover:underline"
    >
      <Icon className="h-4 w-4" type="open" />
      <span data-test-id="TestRun-PullRequest" className="whitespace-nowrap">
        PR {prNumber}
      </span>
    </Link>
  );
}

export function RunSummary({
  testRun,
  durationMs,
  testFilterByText,
  setTestFilterByText,
  filterCurrentRunByStatus,
  setFilterCurrentRunByStatus,
}: {
  testRun: TestRun;
  durationMs: number;
  testFilterByText: string;
  setTestFilterByText: (value: string) => void;
  filterCurrentRunByStatus: "all" | "failed-and-flaky";
  setFilterCurrentRunByStatus: (value: "all" | "failed-and-flaky") => void;
}) {
  const { tests } = useTestRunDetailsSuspends(testRun.id);
  const {
    contextMenu: contextMenuStatusFilter,
    onContextMenu: onClickStatusFilter,
    onKeyDown: onKeyDownStatusFilter,
  } = useContextMenu(
    <>
      <ContextMenuItem dataTestId="all" onSelect={() => setFilterCurrentRunByStatus("all")}>
        All tests
      </ContextMenuItem>
      <ContextMenuItem
        dataTestId="failed-and-flaky"
        onSelect={() => setFilterCurrentRunByStatus("failed-and-flaky")}
      >
        Failed and flaky
      </ContextMenuItem>
    </>,
    { alignTo: "auto-target" }
  );

  return (
    <div
      className={`flex flex-col gap-2 border-b border-themeBorder`}
      data-test-id="TestRunSummary"
    >
      {tests?.length ? (
        <>
          <div className="flex flex-row items-center justify-between gap-2">
            <Dropdown
              className="flex-grow"
              data-test-id="TestRunSummary-StatusFilter-DropdownTrigger"
              onClick={onClickStatusFilter}
              onKeyDown={onKeyDownStatusFilter}
              label={filterCurrentRunByStatus === "all" ? "All runs" : "Failed and flaky"}
            >
              {contextMenuStatusFilter}
            </Dropdown>
            <RunStats testRunId={testRun.id} />
          </div>

          <FilterField
            placeholder="Filter tests"
            dataTestId="TestRunSummary-Filter"
            value={testFilterByText}
            onChange={setTestFilterByText}
          />
        </>
      ) : null}
      <div
        data-test-id="TestRunSummary-Title"
        className="overflow-hidden overflow-ellipsis whitespace-nowrap border-b border-themeBorder px-4 pt-2 pb-4 font-medium"
      >
        {getTestRunTitle(testRun)}
      </div>
      <div className="px-4 pt-2 pb-4 text-xs">
        <Attributes testRun={testRun} durationMs={durationMs} />
      </div>
    </div>
  );
}
