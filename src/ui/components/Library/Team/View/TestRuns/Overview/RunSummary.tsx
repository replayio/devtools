import { useContext, useState, useRef } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { TestRun } from "ui/hooks/tests";
import { useGetTeamIdFromRoute } from "ui/components/Library/Team/utils";
import {
  getDurationString,
  getTruncatedRelativeDate,
} from "../../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "../AttributeContainer";
import { RunStats } from "../RunStats";
import { getDuration } from "../utils";
import { TestRunOverviewContext } from "./TestRunOverviewContainerContextType";

function Title({ testRun }: { testRun: TestRun }) {
  const workspaceId = useGetTeamIdFromRoute();
  const title = testRun.commit?.title || "";
  const formatted = title.length > 80 ? title.slice(0, 80) + "…" : title;
  const [showCopied, setShowCopied] = useState(false);
  const timeoutKey = useRef<NodeJS.Timeout | null>(null);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/team/${workspaceId}/test-run/${testRun.id}`;
    navigator.clipboard.writeText(url);

    if (timeoutKey.current) {
      clearTimeout(timeoutKey.current);
    }

    setShowCopied(true);
    timeoutKey.current = setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="flex flex-row items-center space-x-2 text-xl font-medium">
      <div>
        {formatted}
        <button onClick={handleCopyLink} className="ml-2 hover:text-primaryAccent">
          <MaterialIcon>content_copy</MaterialIcon>
          {showCopied ? (
            <div className="bg-opacity-700 transition-transform absolute mb-1.5 rounded-lg bg-black p-1.5 text-white shadow-2xl text-xs">
              Copied
            </div>
          ) : (
            ""
          )}
        </button>
      </div>
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
  const testRun = useContext(TestRunOverviewContext).testRun!;

  return (
    <div className="flex flex-col p-4 mb-2 space-y-2 border-b border-themeBorder">
      <div className="flex flex-row justify-between">
        <Title testRun={testRun} />
        <RunStats testRun={testRun} />
      </div>
      <Attributes testRun={testRun} />
    </div>
  );
}
