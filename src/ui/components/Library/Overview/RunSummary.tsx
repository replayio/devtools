import { useContext } from "react";
import { TestRun } from "ui/hooks/tests";
import { AttributeContainer } from "../Content/TestRuns/AttributeContainer";
import { RunStats } from "../Content/TestRuns/RunStats";
import { getDuration, getDurationString } from "../Content/TestRuns/utils";
import { getTruncatedRelativeDate } from "../RecordingRow";
import { OverviewContext } from "./OverviewContainer";
import { SourceMetadata } from "ui/types";

function Title({ testRun }: { testRun: TestRun }) {
  const title = testRun.commit?.title || "";
  const formatted = title.length > 80 ? title.slice(0, 80) + "…" : title;

  return (
    <div className="flex flex-row items-center space-x-2 text-xl font-medium">
      <div>{formatted}</div>
    </div>
  );
}

function Attributes({ testRun }: { testRun: TestRun }) {
  const user = testRun.recordings[0].metadata.source?.trigger?.user;
  const firstRecording = testRun.recordings[0];

  const duration = getDuration(testRun.recordings);
  const durationString = getDurationString(duration);
  const branch = firstRecording.metadata.source?.branch;
  const merge = firstRecording.metadata.source?.merge;

  return (
    <div className="flex flex-row flex-wrap items-center text-xs">
      <AttributeContainer icon="schedule">
        {getTruncatedRelativeDate(firstRecording.date)}
      </AttributeContainer>
      <AttributeContainer icon="person">{user!}</AttributeContainer>
      {testRun.event !== "pull_request" && (
        <AttributeContainer icon="play_circle">{testRun.event}</AttributeContainer>
      )}
      {merge && (
        <AttributeContainer title={merge.title} icon="merge_type">
          {merge.id}
        </AttributeContainer>
      )}

      {!merge && branch && <AttributeContainer icon="fork_right">{branch}</AttributeContainer>}
      <AttributeContainer icon="timer">{durationString}</AttributeContainer>
    </div>
  );
}

export function RunSummary() {
  const testRun = useContext(OverviewContext).testRun!;

  return (
    <div className="mb-2 flex flex-col  space-y-2 border-b p-4">
      <div className="flex flex-row justify-between">
        <Title testRun={testRun} />
        <RunStats testRun={testRun} />
      </div>
      <Attributes testRun={testRun} />
    </div>
  );
}
