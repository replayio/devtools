import Link from "next/link";

import { TestSuiteRun, TestSuiteRunMode } from "ui/hooks/tests";

import {
  getDurationString,
  getTruncatedRelativeDate,
} from "../../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "../AttributeContainer";
import { RunStats } from "../RunStats";
import { getDuration } from "../utils";

function Title({ testSuiteRun }: { testSuiteRun: TestSuiteRun }) {
  return (
    <div className="flex flex-row items-center space-x-2 overflow-hidden">
      <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-xl font-medium">
        {testSuiteRun.title}
      </div>
    </div>
  );
}

function getModeIcon(mode: TestSuiteRunMode): string[] {
  switch (mode) {
    case "diagnostics":
      return ["biotech", "Diagnostic Mode"];
    case "stress":
      return ["repeat", "Stress Test Mode"];
    case "record-on-retry":
      return ["repeatone", "Record on Retry Mode"];
  }
}

export function ModeAttribute({ testSuiteRun }: { testSuiteRun: TestSuiteRun }) {
  const { mode } = testSuiteRun;
  if (!mode) {
    return null;
  }

  const [modeIcon, modeText] = getModeIcon(mode);

  return <AttributeContainer icon={modeIcon}>{modeText}</AttributeContainer>;
}

export function Attributes({ testSuiteRun }: { testSuiteRun: TestSuiteRun }) {
  const { date, results, source, title } = testSuiteRun;
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
        <ModeAttribute testSuiteRun={testSuiteRun} />
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

function RunnerLink({ testSuiteRun }: { testSuiteRun: TestSuiteRun }) {
  if (!testSuiteRun.source?.triggerUrl) {
    return null;
  }

  return (
    <Link
      href={testSuiteRun.source.triggerUrl}
      target="_blank"
      rel="noreferrer noopener"
      className="hover:underline"
    >
      <span>View run in GitHub</span>
    </Link>
  );
}

export function RunSummary({ testSuiteRun }: { testSuiteRun: TestSuiteRun }) {
  const { title } = testSuiteRun;

  return (
    <div className="mb-2 flex flex-col space-y-2 border-b border-themeBorder p-4">
      <div className="flex flex-row justify-between">
        <Title testSuiteRun={testSuiteRun} />
        <RunStats testSuiteRun={testSuiteRun} />
      </div>
      <div className="flex flex-row items-center justify-between text-xs">
        <Attributes testSuiteRun={testSuiteRun} />
        <RunnerLink testSuiteRun={testSuiteRun} />
      </div>
      {title ? (
        <div className="flex flex-row items-center justify-between text-xs">{title}</div>
      ) : null}
    </div>
  );
}
