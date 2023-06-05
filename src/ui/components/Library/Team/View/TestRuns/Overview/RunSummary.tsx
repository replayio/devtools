import Link from "next/link";
import { useContext } from "react";

import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { TestSuite, TestSuiteMode } from "shared/test-suites/types";
import { RecordingCache } from "ui/components/TestSuite/suspense/RecordingCache";

import {
  getDurationString,
  getTruncatedRelativeDate,
} from "../../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "../AttributeContainer";
import { RunStats } from "../RunStats";
import { getDuration } from "../utils";

function Title({ testSuite }: { testSuite: TestSuite }) {
  return (
    <div className="flex flex-row items-center space-x-2 overflow-hidden">
      <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-xl font-medium">
        {testSuite.title}
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
  const { recordingId } = useContext(SessionContext);

  const { date, results, title } = testSuite;
  const { recordings } = results;

  const duration = getDuration(recordings);
  const durationString = getDurationString(duration);

  const recording = RecordingCache.read(recordingId);
  const source = recording.metadata?.source;
  if (source) {
    const { branch = "branch", merge, trigger } = source;

    return (
      <div className="flex flex-row flex-wrap items-center pl-1">
        <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
        {trigger?.user ? (
          <AttributeContainer icon="person">{trigger.user}</AttributeContainer>
        ) : null}
        {merge != null ? (
          <AttributeContainer maxWidth="160px" icon="fork_right">
            {branch}
          </AttributeContainer>
        ) : (
          <AttributeContainer title={title} icon="merge_type">
            {branch}
          </AttributeContainer>
        )}
        <AttributeContainer icon="timer">{durationString}</AttributeContainer>
        <ModeAttribute testSuite={testSuite} />
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

function RunnerLink({ testSuite }: { testSuite: TestSuite }) {
  if (!testSuite.source?.triggerUrl) {
    return null;
  }

  return (
    <Link
      href={testSuite.source.triggerUrl}
      target="_blank"
      rel="noreferrer noopener"
      className="hover:underline"
    >
      <span>View run in GitHub</span>
    </Link>
  );
}

export function RunSummary({ testSuite }: { testSuite: TestSuite }) {
  const { title } = testSuite;

  return (
    <div className="mb-2 flex flex-col space-y-2 border-b border-themeBorder p-4">
      <div className="flex flex-row justify-between">
        <Title testSuite={testSuite} />
        <RunStats testSuite={testSuite} />
      </div>
      <div className="flex flex-row items-center justify-between text-xs">
        <Attributes testSuite={testSuite} />
        <RunnerLink testSuite={testSuite} />
      </div>
      {title ? (
        <div className="flex flex-row items-center justify-between text-xs">{title}</div>
      ) : null}
    </div>
  );
}
