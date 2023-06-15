import Link from "next/link";

import Icon from "replay-next/components/Icon";
import { GroupedTestCases, Mode } from "shared/test-suites/TestRun";
import { BranchIcon } from "ui/components/Library/Team/View/TestRuns/BranchIcon";

import {
  getDurationString,
  getTruncatedRelativeDate,
} from "../../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "../AttributeContainer";
import { RunStats } from "../RunStats";
import { getDuration } from "../utils";

function getModeIcon(mode: Mode): string[] {
  switch (mode) {
    case "diagnostics":
      return ["biotech", "Diagnostic Mode"];
    case "stress":
      return ["repeat", "Stress Test Mode"];
    case "record-on-retry":
      return ["repeatone", "Record on Retry Mode"];
  }
}

export function ModeAttribute({ groupedTestCases }: { groupedTestCases: GroupedTestCases }) {
  const { mode } = groupedTestCases;
  if (!mode) {
    return null;
  }

  const [modeIcon, modeText] = getModeIcon(mode);

  return <AttributeContainer icon={modeIcon}>{modeText}</AttributeContainer>;
}

export function Attributes({ groupedTestCases }: { groupedTestCases: GroupedTestCases }) {
  const { date, results, source, primaryTitle: title } = groupedTestCases;
  const { recordings } = results;

  const duration = getDuration(recordings);
  const durationString = getDurationString(duration);

  if (source) {
    const { branchName, isPrimaryBranch, user } = source;

    return (
      <div className="flex flex-row flex-wrap items-center gap-4">
        <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
        {user ? <AttributeContainer icon="person">{user}</AttributeContainer> : null}
        <BranchIcon branchName={branchName} isPrimaryBranch={isPrimaryBranch} title={title} />
        <AttributeContainer icon="timer">{durationString}</AttributeContainer>
        <ModeAttribute groupedTestCases={groupedTestCases} />
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

function PullRequestLink({ groupedTestCases }: { groupedTestCases: GroupedTestCases }) {
  const { source } = groupedTestCases;
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

function RunnerLink({ groupedTestCases }: { groupedTestCases: GroupedTestCases }) {
  if (!groupedTestCases.source?.triggerUrl) {
    return null;
  }

  return (
    <Link
      href={groupedTestCases.source.triggerUrl}
      target="_blank"
      rel="noreferrer noopener"
      className="flex flex-row items-center gap-1 hover:underline"
    >
      <Icon className="h-4 w-4" type="open" />
      <span>Workflow</span>
    </Link>
  );
}

export function RunSummary({ groupedTestCases }: { groupedTestCases: GroupedTestCases }) {
  return (
    <div className="flex flex-col gap-1 border-b border-themeBorder p-4">
      <div className="flex flex-row items-center justify-between gap-1">
        <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-xl font-medium">
          {groupedTestCases.primaryTitle}
        </div>
        <RunStats groupedTestCases={groupedTestCases} />
      </div>
      <div className="text overflow-hidden overflow-ellipsis whitespace-nowrap font-medium text-bodySubColor">
        {groupedTestCases.secondaryTitle}
      </div>
      <div className="mt-1 flex w-full flex-row items-center gap-4 text-xs">
        <Attributes groupedTestCases={groupedTestCases} />
        <div className="grow" />
        <PullRequestLink groupedTestCases={groupedTestCases} />
        <RunnerLink groupedTestCases={groupedTestCases} />
      </div>
    </div>
  );
}
