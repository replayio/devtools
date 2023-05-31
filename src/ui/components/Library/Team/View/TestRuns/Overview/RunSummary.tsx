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
  return (
    <div className="flex flex-row items-center space-x-2 overflow-hidden">
      <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-xl font-medium">
        {testRun.title}
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
  const { date, results, source, title } = testRun;
  const { recordings } = results;

  const duration = getDuration(recordings);
  const durationString = getDurationString(duration);

  if (source) {
    const { branchName, branchStatus, user } = source;

    return (
      <div className="flex flex-row flex-wrap items-center pl-1">
        <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
        {user ? <AttributeContainer icon="person">{user}</AttributeContainer> : null}
        {branchStatus === "open" ? (
          <AttributeContainer maxWidth="160px" icon="fork_right">
            {branchName}
          </AttributeContainer>
        ) : (
          <AttributeContainer title={title} icon="merge_type">
            {branchStatus}
          </AttributeContainer>
        )}
        <AttributeContainer icon="timer">{durationString}</AttributeContainer>
        <ModeAttribute testRun={testRun} />
      </div>
    );
  } else {
    return (
      <div className="flex flex-row flex-wrap items-center pl-1">
        <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
      </div>
    );
  }
}

function RunnerLink({ testRun }: { testRun: TestRun }) {
  if (!testRun?.source?.triggerUrl) {
    return null;
  }

  return (
    <Link
      href={testRun.source.triggerUrl}
      target="_blank"
      rel="noreferrer noopener"
      className="hover:underline"
    >
      <span>View run in GitHub</span>
    </Link>
  );
}

export function RunSummary({ testRun }: { testRun: TestRun }) {
  const { title } = testRun;

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
      {title ? (
        <div className="flex flex-row items-center justify-between text-xs">{title}</div>
      ) : null}
    </div>
  );
}
