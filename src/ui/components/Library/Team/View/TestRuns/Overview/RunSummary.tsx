import { captureException } from "@sentry/react";
import Link from "next/link";

import Icon from "replay-next/components/Icon";
import { Recording } from "shared/graphql/types";
import { TestRun, getTestRunTitle } from "shared/test-suites/TestRun";
import { BranchIcon } from "ui/components/Library/Team/View/TestRuns/BranchIcon";

import {
  getDurationString,
  getTruncatedRelativeDate,
} from "../../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "../AttributeContainer";
import { RunStats } from "../RunStats";

export function ModeAttribute({ testRun }: { testRun: TestRun }) {
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

export function Attributes({
  recordings,
  testRun,
  durationMs,
}: {
  recordings: Recording[];
  testRun: TestRun;
  durationMs: number;
}) {
  const { date, source } = testRun;

  const durationString = getDurationString(durationMs);

  if (source) {
    const { branchName, isPrimaryBranch, user } = source;

    return (
      <div className="flex flex-row flex-wrap items-center space-x-4">
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
      <span data-test-id="TestRun-PullRequest">PR {prNumber}</span>
    </Link>
  );
}

function RunnerLink({ testRun }: { testRun: TestRun }) {
  if (!testRun.source?.triggerUrl) {
    return null;
  }

  return (
    <Link
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

export function RunSummary({
  isPending,
  recordings,
  testRun,
  durationMs,
}: {
  isPending: boolean;
  recordings: Recording[];
  testRun: TestRun;
  durationMs: number;
}) {
  const { source } = testRun;

  return (
    <div
      className={`flex flex-col border-b border-themeBorder ${isPending ? "opacity-50" : ""}`}
      data-test-id="TestRunSummary"
    >
      <div className="flex flex-row items-center justify-between gap-1 px-4 pt-3">
        <div className="flex-grow"></div>
        <RunStats testRunId={testRun.id} />
      </div>
      <div className="overflow-hidden overflow-ellipsis whitespace-nowrap border-b border-themeBorder px-4  py-3 font-bold">
        {getTestRunTitle(testRun)}
      </div>
      <div className="flex w-full flex-row items-center gap-4 py-3 px-4 text-xs">
        <Attributes recordings={recordings} testRun={testRun} durationMs={durationMs} />
        <div className="grow" />
        <PullRequestLink testRun={testRun} />
        <RunnerLink testRun={testRun} />
      </div>
    </div>
  );
}
