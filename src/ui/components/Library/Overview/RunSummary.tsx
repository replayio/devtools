import { useContext } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { TestRun } from "ui/hooks/tests";
import { AttributeContainer } from "../Content/TestRuns/AttributeContainer";
import { RunStats } from "../Content/TestRuns/RunStats";
import { getDuration, getDurationString } from "../Content/TestRuns/utils";
import { getTruncatedRelativeDate } from "../RecordingRow";
import { OverviewContext } from "./OverviewContainer";

function Title({ testRun }: { testRun: TestRun }) {
  return (
    <div className="flex flex-row items-center space-x-2 text-xl">
      <div>{testRun.commit?.title}</div>
    </div>
  );
}

function Attributes({ testRun }: { testRun: TestRun }) {
  const user = testRun.recordings[0].metadata.source?.trigger?.user;
  const firstRecording = testRun.recordings[0];

  const duration = getDuration(testRun.recordings);
  const durationString = getDurationString(duration);
  const branch = firstRecording.metadata.source?.branch || "Unknown branch";

  return (
    <div className="flex flex-row items-center space-x-4 overflow-hidden text-xs">
      <AttributeContainer icon="play_circle">{testRun.event}</AttributeContainer>
      <AttributeContainer icon="fork_right">{branch}</AttributeContainer>
      <AttributeContainer icon="timer">
        {getTruncatedRelativeDate(firstRecording.date)}
      </AttributeContainer>
      <AttributeContainer icon="timer">{durationString}</AttributeContainer>
      {user ? <div>{user}</div> : null}
      {firstRecording.metadata.source?.merge ? (
        <div
          className="flex flex-row items-center space-x-1"
          title={firstRecording.metadata.source.merge.title}
        >
          <div className="font-bold">PR</div>
          <div>{firstRecording.metadata.source.merge.id}</div>
        </div>
      ) : null}
    </div>
  );
}

export function RunSummary() {
  const testRun = useContext(OverviewContext).testRun!;

  return (
    <div className="flex flex-col p-4 space-y-2 border-b">
      <Title testRun={testRun} />
      <Attributes testRun={testRun} />
      {/* <Results testRun={testRun} /> */}
      <RunStats testRun={testRun} />
    </div>
  );
}
