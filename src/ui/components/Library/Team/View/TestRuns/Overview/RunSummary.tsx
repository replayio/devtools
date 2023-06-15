import Link from "next/link";

import Icon from "replay-next/components/Icon";
import { TestSuite, TestSuiteMode } from "shared/test-suites/TestRun";
import { BranchIcon } from "ui/components/Library/Team/View/TestRuns/BranchIcon";

import {
  getDurationString,
  getTruncatedRelativeDate,
} from "../../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "../AttributeContainer";
import { RunStats } from "../RunStats";
import { getDuration } from "../utils";

function Title({ testSuite }: { testSuite: TestSuite }) {
  return (
    <div className="flex flex-col overflow-hidden">
      <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-xl font-medium">
        {testSuite.primaryTitle}
      </div>
      <div className="text overflow-hidden overflow-ellipsis whitespace-nowrap font-medium text-bodySubColor">
        {testSuite.secondaryTitle}
      </div>
    </div>
  );
}

function getModeIcon(mode: TestSuiteMode): string[] {
  switch (mode) {
    case "diagnostics":
      return ["biotech", "Diagnostic Mode"];
    case "stress":
      return ["repeat", "Stress Test Mode"];
    case "record-on-retry":
      return ["repeatone", "Record on Retry Mode"];
  }
}

export function ModeAttribute({ testSuite }: { testSuite: TestSuite }) {
  const { mode } = testSuite;
  if (!mode) {
    return null;
  }

  const [modeIcon, modeText] = getModeIcon(mode);

  return <AttributeContainer icon={modeIcon}>{modeText}</AttributeContainer>;
}

export function Attributes({ testSuite }: { testSuite: TestSuite }) {
  const { date, results, source, primaryTitle: title } = testSuite;
  const { recordings } = results;

  const duration = getDuration(recordings);
  const durationString = getDurationString(duration);

  if (source) {
    const { branchName, isPrimaryBranch, user } = source;

    return (
      <div className="flex flex-row flex-wrap items-center gap-4 pl-1">
        <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
        {user ? <AttributeContainer icon="person">{user}</AttributeContainer> : null}
        <BranchIcon branchName={branchName} isPrimaryBranch={isPrimaryBranch} title={title} />
        <AttributeContainer icon="timer">{durationString}</AttributeContainer>
        <ModeAttribute testSuite={testSuite} />
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

function PullRequestLink({ testSuite }: { testSuite: TestSuite }) {
  const { source } = testSuite;
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

function RunnerLink({ testSuite }: { testSuite: TestSuite }) {
  if (!testSuite.source?.triggerUrl) {
    return null;
  }

  return (
    <Link
      href={testSuite.source.triggerUrl}
      target="_blank"
      rel="noreferrer noopener"
      className="flex flex-row items-center gap-1 hover:underline"
    >
      <Icon className="h-4 w-4" type="open" />
      <span>Workflow</span>
    </Link>
  );
}

export function RunSummary({ testSuite }: { testSuite: TestSuite }) {
  return (
    <div className="flex flex-col space-y-2 border-b border-themeBorder p-4">
      <div className="flex flex-row justify-between">
        <Title testSuite={testSuite} />
        <RunStats testSuite={testSuite} />
      </div>
      <div className="flex w-full flex-row items-center gap-4 text-xs">
        <Attributes testSuite={testSuite} />
        <div className="grow" />
        <PullRequestLink testSuite={testSuite} />
        <RunnerLink testSuite={testSuite} />
      </div>
    </div>
  );
}
