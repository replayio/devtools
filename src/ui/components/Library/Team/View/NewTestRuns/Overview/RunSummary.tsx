import { captureException } from "@sentry/react";
import Link from "next/link";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { TestRun, getTestRunTitle } from "shared/test-suites/TestRun";
import { RunStats } from "ui/components/Library/Team/View/NewTestRuns/RunStats";
import { AttributeContainer } from "ui/components/Library/Team/View/TestRuns/AttributeContainer";
import { BranchIcon } from "ui/components/Library/Team/View/TestRuns/BranchIcon";

import {
  getDurationString,
  getTruncatedRelativeDate,
} from "../../Recordings/RecordingListItem/RecordingListItem";
import { ModeAttribute, RunnerLink } from "../../TestRuns/Overview/RunSummary";
import { FilterField } from "../FilterField";
import dropdownStyles from "../Dropdown.module.css";

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
        <BranchIcon
          branchName={branchName}
          isPrimaryBranch={isPrimaryBranch ?? false}
          title={getTestRunTitle(testRun)}
        />
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
      <div className="flex flex-row items-center justify-between gap-2">
        <div
          className={`flex-grow ${dropdownStyles.dropdownTrigger}`}
          data-test-id="TestRunSummary-StatusFilter-DropdownTrigger"
          onClick={onClickStatusFilter}
          onKeyDown={onKeyDownStatusFilter}
          tabIndex={0}
        >
          {filterCurrentRunByStatus === "all" ? "All runs" : "Failed and flaky"}
          <Icon className="h-5 w-5" type="chevron-down" />
        </div>
        {contextMenuStatusFilter}
        <RunStats testRunId={testRun.id} />
      </div>

      <FilterField
        placeholder="Filter tests"
        dataTestId="TestRunSummary-Filter"
        value={testFilterByText}
        onChange={setTestFilterByText}
      />
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
