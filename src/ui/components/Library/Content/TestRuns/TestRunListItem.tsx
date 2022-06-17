import { TestRun } from "ui/hooks/tests";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getTruncatedRelativeDate } from "../../RecordingRow";
import { useContext } from "react";
import { LibraryContext } from "../../useFilters";
import { getDuration, getDurationString } from "./utils";
import { RunStats } from "./RunStats";
import { AttributeContainer } from "./AttributeContainer";
import { SourceMetadata } from "ui/types";

function Title({ testRun }: { testRun: TestRun }) {
  const title = testRun.commit?.title || "Unknown";
  const formatted = title.length > 80 ? title.slice(0, 80) + "..." : title;
  return (
    <div className="wrap flex shrink grow-0 flex-nowrap overflow-hidden text-ellipsis">
      {formatted}
    </div>
  );
}

function AttributeMerge({ source }: { source: SourceMetadata | undefined }) {
  if (!source?.merge) {
    return null;
  }

  return (
    <div className="mr-4 flex flex-row items-center space-x-1" title={source.merge.title}>
      <div className="font-bold">PR</div>
      <div>{source.merge.id}</div>
    </div>
  );
}
function Attributes({ testRun, selected }: { testRun: TestRun; selected: boolean }) {
  const { recordings, branch, date } = testRun;
  const user = testRun.recordings[0].metadata.source?.trigger?.user;

  const duration = getDuration(testRun.recordings);
  const durationString = getDurationString(duration);
  const textColor = selected ? "text-gray-700" : "text-gray-500";

  return (
    <div className={`${textColor} flex flex-row items-center text-xs font-light`}>
      <AttributeContainer>{user!}</AttributeContainer>
      <AttributeMerge source={recordings[0].metadata.source} />
      <AttributeContainer maxWidth="160px" icon="fork_right">
        {branch}
      </AttributeContainer>
      <AttributeContainer icon="play_circle">{testRun.event}</AttributeContainer>
      <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
      <AttributeContainer icon="timer">{durationString}</AttributeContainer>
    </div>
  );
}

function Status({ failCount }: { failCount: number }) {
  return (
    <div className={`flex self-start ${failCount > 0 ? "text-red-500" : "text-green-600"} `}>
      <MaterialIcon iconSize="xl">radio_button_checked</MaterialIcon>
    </div>
  );
}

export function TestRunListItem({ testRun, onClick }: { testRun: TestRun; onClick: () => void }) {
  const { preview } = useContext(LibraryContext);
  const failCount = testRun.recordings.filter(r => r.metadata.test?.result !== "passed").length;
  const isSelected = preview?.id.toString() === testRun.id;
  const style = {
    backgroundColor: isSelected ? "#A3DEFA" : "",
  };

  return (
    <div
      className="flex flex-grow cursor-pointer flex-row items-center space-x-3 overflow-hidden rounded-md border-b bg-white px-4 py-3 hover:bg-[#e8f8ff]"
      style={style}
      onClick={onClick}
    >
      <Status failCount={failCount} />
      <div className="flex flex-grow flex-col space-y-1">
        <div className="flex flex-row justify-between">
          <Title testRun={testRun} />
          <RunStats testRun={testRun} />
        </div>
        <Attributes selected={isSelected} testRun={testRun} />
      </div>
    </div>
  );
}
