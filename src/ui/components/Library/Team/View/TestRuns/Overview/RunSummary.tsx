import Link from "next/link";

import { TestRun } from "ui/hooks/tests";

import {
  getDurationString,
  getTruncatedRelativeDate,
} from "../../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "../AttributeContainer";
import { RunStats } from "../RunStats";
import { getDuration } from "../utils";

function Title({ testRun }: { testRun: TestRun }) {
  const title = testRun?.commitTitle;

  return (
    <div className="flex flex-row items-center space-x-2 overflow-hidden">
      <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-xl font-medium">
        {title}
      </div>
    </div>
  );
}

function getModeIcon(mode: string | null): string[] {
  switch (mode) {
    case "diagnostics":
      return ["biotech", "Diagnostic Mode"];
    case "stress":
      return ["repeat", "Stress Test Mode"];
    case "record-on-retry":
      return ["repeatone", "Record on Retry Mode"];
  }

  return [];
}

export function ModeAttribute({ testRun }: { testRun: TestRun }) {
  const { mode } = testRun;

  const [modeIcon, modeText] = getModeIcon(mode);

  if (!modeIcon) {
    return null;
  }

  return <AttributeContainer icon={modeIcon}>{modeText}</AttributeContainer>;
}

export function Attributes({ testRun }: { testRun: TestRun }) {
  const duration = getDuration(testRun.recordings!);
  const durationString = getDurationString(duration);
  const { user, date, mergeId, mergeTitle, branch, mode } = testRun;

  return (
    <div className="flex flex-row flex-wrap items-center pl-1">
      <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
      {user ? <AttributeContainer icon="person">{user}</AttributeContainer> : null}
      {mergeId && (
        <AttributeContainer title={mergeTitle} icon="merge_type">
          {mergeId}
        </AttributeContainer>
      )}

      {!mergeId && branch && <AttributeContainer icon="fork_right">{branch}</AttributeContainer>}
      <AttributeContainer icon="timer">{durationString}</AttributeContainer>
      <ModeAttribute testRun={testRun} />
    </div>
  );
}

function RunnerLink({ testRun }: { testRun: TestRun }) {
  const { triggerUrl } = testRun;

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
      {testRun.title ? (
        <div className="flex flex-row items-center justify-between text-xs">{testRun.title}</div>
      ) : null}
    </div>
  );
}
