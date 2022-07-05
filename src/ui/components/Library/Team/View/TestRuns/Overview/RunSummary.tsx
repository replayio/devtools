import Link from "next/link";
import { useContext } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { TestRun } from "ui/hooks/tests";
import {
  getDurationString,
  getTruncatedRelativeDate,
} from "../../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "../AttributeContainer";
import { RunStats } from "../RunStats";
import { getDuration } from "../utils";
import { TestRunOverviewContext } from "./TestRunOverviewContainerContextType";

function Title({ testRun }: { testRun: TestRun }) {
  const title = testRun?.commitTitle;

  return (
    <div className="flex flex-row items-center space-x-2 overflow-hidden">
      <div className="overflow-hidden text-xl font-medium overflow-ellipsis whitespace-nowrap">
        {title}
      </div>
    </div>
  );
}

function Attributes({ testRun }: { testRun: TestRun }) {
  const duration = getDuration(testRun.recordings!);
  const durationString = getDurationString(duration);
  const { user, date, mergeId, mergeTitle, branch } = testRun;

  return (
    <div className="flex flex-row flex-wrap items-center">
      <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
      <AttributeContainer icon="person">{user!}</AttributeContainer>
      {mergeId && (
        <AttributeContainer title={mergeTitle} icon="merge_type">
          {mergeId}
        </AttributeContainer>
      )}

      {!mergeId && branch && <AttributeContainer icon="fork_right">{branch}</AttributeContainer>}
      <AttributeContainer icon="timer">{durationString}</AttributeContainer>
    </div>
  );
}

function RunnerLink({ testRun }: { testRun: TestRun }) {
  const { triggerUrl } = testRun;

  if (!triggerUrl) {
    return null;
  }

  return (
    <Link href={triggerUrl}>
      <a target="_blank" rel="noreferrer noopener" className="hover:underline">
        <span>View run in GitHub</span>
      </a>
    </Link>
  );
}

export function RunSummary() {
  const testRun = useContext(TestRunOverviewContext).testRun!;

  return (
    <div className="flex flex-col p-4 mb-2 space-y-2 border-b border-themeBorder">
      <div className="flex flex-row justify-between">
        <Title testRun={testRun} />
        <RunStats testRun={testRun} />
      </div>
      <div className="flex flex-row items-center justify-between text-xs">
        <Attributes testRun={testRun} />
        <RunnerLink testRun={testRun} />
      </div>
    </div>
  );
}
