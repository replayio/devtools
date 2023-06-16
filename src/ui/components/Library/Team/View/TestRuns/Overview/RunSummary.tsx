import { captureException } from "@sentry/react";
import Link from "next/link";

import Icon from "replay-next/components/Icon";
import { Summary, getTestRunTitle } from "shared/test-suites/TestRun";
import { BranchIcon } from "ui/components/Library/Team/View/TestRuns/BranchIcon";

import {
  getDurationString,
  getTruncatedRelativeDate,
} from "../../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "../AttributeContainer";
import { RunStats } from "../RunStats";
import { getDuration } from "../utils";

export function ModeAttribute({ summary }: { summary: Summary }) {
  const { mode } = summary;

  let modeIcon = null;
  let modeText = null;

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
      captureException(new Error("Unexpected test run mode").stack, { extra: { mode } });
      break;
  }

  if (modeIcon == null && modeText == null) {
    return null;
  }

  return <AttributeContainer icon={modeIcon}>{modeText}</AttributeContainer>;
}

export function Attributes({ summary }: { summary: Summary }) {
  const { date, results, source } = summary;
  const { recordings } = results;

  const duration = getDuration(recordings);
  const durationString = getDurationString(duration);

  if (source) {
    const { branchName, isPrimaryBranch, user } = source;

    return (
      <div className="flex flex-row flex-wrap items-center gap-4">
        <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
        {user ? <AttributeContainer icon="person">{user}</AttributeContainer> : null}
        <BranchIcon
          branchName={branchName}
          isPrimaryBranch={isPrimaryBranch}
          title={getTestRunTitle(summary)}
        />
        <AttributeContainer icon="timer">{durationString}</AttributeContainer>
        <ModeAttribute summary={summary} />
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

function PullRequestLink({ summary }: { summary: Summary }) {
  const { source } = summary;
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
      <span>PR {prNumber}</span>
    </Link>
  );
}

function RunnerLink({ summary }: { summary: Summary }) {
  if (!summary.source?.triggerUrl) {
    return null;
  }

  return (
    <Link
      href={summary.source.triggerUrl}
      target="_blank"
      rel="noreferrer noopener"
      className="flex flex-row items-center gap-1 hover:underline"
    >
      <Icon className="h-4 w-4" type="open" />
      <span>Workflow</span>
    </Link>
  );
}

export function RunSummary({ summary }: { summary: Summary }) {
  const { source } = summary;

  return (
    <div className="flex flex-col gap-1 border-b border-themeBorder p-4">
      <div className="flex flex-row items-center justify-between gap-1">
        <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-xl font-medium">
          {getTestRunTitle(summary)}
        </div>
        <RunStats summary={summary} />
      </div>
      {source?.groupLabel && (
        <div className="text overflow-hidden overflow-ellipsis whitespace-nowrap font-medium text-bodySubColor">
          {source.groupLabel}
        </div>
      )}
      <div className="mt-1 flex w-full flex-row items-center gap-4 text-xs">
        <Attributes summary={summary} />
        <div className="grow" />
        <PullRequestLink summary={summary} />
        <RunnerLink summary={summary} />
      </div>
    </div>
  );
}
