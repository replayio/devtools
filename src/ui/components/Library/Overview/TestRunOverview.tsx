import { useContext } from "react";
import { RunResults } from "./RunResults";
import { TestStatus } from "../Content/TestRuns/TestStatus";

import { OverviewContainer, OverviewContext } from "./OverviewContainer";
import Spinner from "ui/components/shared/Spinner";
import { TestRun } from "ui/hooks/tests";
import { AttributeContainer } from "../Content/TestRuns/AttributeContainer";
import { getDuration, getDurationString } from "../Content/TestRuns/utils";
import { getTruncatedRelativeDate } from "../RecordingRow";

export function Title({ testRun }: { testRun: TestRun }) {
  const title = testRun.commit?.title || "";
  const formatted = title.length > 80 ? title.slice(0, 80) + "…" : title;
  return (
    <div className="flex flex-row items-center space-x-2 text-lg font-semibold">{formatted}</div>
  );
}

export function Attributes({ testRun }: { testRun: TestRun }) {
  const user = testRun.recordings[0].metadata.source?.trigger?.user;
  const firstRecording = testRun.recordings[0];

  const duration = getDuration(testRun.recordings);
  const durationString = getDurationString(duration);
  const branch = firstRecording.metadata.source?.branch;
  const merge = firstRecording.metadata.source?.merge;

  return (
    <div className="items-left flex flex-col flex-wrap space-y-3 text-xs">
      <AttributeContainer icon="schedule">
        {getTruncatedRelativeDate(firstRecording.date)}
      </AttributeContainer>
      <AttributeContainer icon="person">{user!}</AttributeContainer>
      {testRun.event !== "pull-request" && (
        <AttributeContainer icon="play_circle">{testRun.event}</AttributeContainer>
      )}
      {merge && (
        <AttributeContainer title={merge.title} icon="merge_type">
          {merge.id}
        </AttributeContainer>
      )}

      {branch && <AttributeContainer icon="fork_right">{branch}</AttributeContainer>}
      <AttributeContainer icon="timer">{durationString}</AttributeContainer>
    </div>
  );
}

export function TestRunOverview() {
  return (
    <OverviewContainer>
      <OverviewContent />
    </OverviewContainer>
  );
}

function OverviewContent() {
  const testRun = useContext(OverviewContext).testRun!;
  const { loading } = useContext(OverviewContext);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Spinner className="w-4 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className=" flex flex-row items-center space-x-2 p-2">
        <TestStatus testRun={testRun} />
        <Title testRun={testRun} />
      </div>

      <div className="overflow-y-auto">
        <div className="flex flex-col space-y-2  p-4">
          <Attributes testRun={testRun} />
        </div>
        <RunResults />
      </div>
    </>
  );
}
