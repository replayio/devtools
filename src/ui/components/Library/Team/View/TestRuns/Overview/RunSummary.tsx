import Link from "next/link";

import { TestRun, TestRunMode } from "ui/hooks/tests";

import {
  getDurationString,
  getTruncatedRelativeDate,
} from "../../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "../AttributeContainer";
import { RunStats } from "../RunStats";
import { getDuration } from "../utils";

function Title({ testRun }: { testRun: TestRun }) {
  const commitTitle = testRun.source.commitTitle;

  return (
    <div className="flex flex-row items-center space-x-2 overflow-hidden">
      <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-xl font-medium">
        {commitTitle}
      </div>
    </div>
  );
}

function getModeIcon(mode: TestRunMode): string[] {
  switch (mode) {
    case "diagnostics":
      return ["biotech", "Diagnostic Mode"];
    case "stress":
      return ["repeat", "Stress Test Mode"];
    case "record-on-retry":
      return ["repeatone", "Record on Retry Mode"];
  }
}

export function ModeAttribute({ testRun }: { testRun: TestRun }) {
  const { mode } = testRun;
  if (!mode) {
    return null;
  }

  const [modeIcon, modeText] = getModeIcon(mode);

  return <AttributeContainer icon={modeIcon}>{modeText}</AttributeContainer>;
}

export function Attributes({ testRun }: { testRun: TestRun }) {
  const { date, results, source } = testRun;
  const { recordings } = results;
  const { branchName, branchStatus, commitTitle, user } = source;

  const duration = getDuration(recordings);
  const durationString = getDurationString(duration);

  return (
    <div className="flex flex-row flex-wrap items-center pl-1">
      <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
      {user ? <AttributeContainer icon="person">{user}</AttributeContainer> : null}

      {branchStatus === "open" ? (
        <AttributeContainer maxWidth="160px" icon="fork_right">
          {branchName}
        </AttributeContainer>
      ) : (
        <AttributeContainer title={commitTitle} icon="merge_type">
          {branchStatus}
        </AttributeContainer>
      )}
      <AttributeContainer icon="timer">{durationString}</AttributeContainer>
      <ModeAttribute testRun={testRun} />
    </div>
  );
}

function RunnerLink({ testRun }: { testRun: TestRun }) {
  const { triggerUrl } = testRun.source;
  if (!triggerUrl) {
    return null;
  }

  return (
    <Link href={triggerUrl} target="_blank" rel="noreferrer noopener" className="hover:underline">
      <span>View run in GitHub</span>
    </Link>
  );
}

export function RunSummary({ testRun }: { testRun: TestRun }) {
  const { commitTitle } = testRun.source;
  return (
    <div className="mb-2 flex flex-col space-y-2 border-b border-themeBorder p-4">
      <div className="flex flex-row justify-between">
        <Title testRun={testRun} />
        <RunStats testRun={testRun} />
      </div>
      <div className="flex flex-row items-center justify-between text-xs">
        <Attributes testRun={testRun} />
        <RunnerLink testRun={testRun} />
      </div>
      {commitTitle ? (
        <div className="flex flex-row items-center justify-between text-xs">{commitTitle}</div>
      ) : null}
    </div>
  );
}
