import { TestRun } from "ui/hooks/tests";
import { getTruncatedRelativeDate } from "../../RecordingRow";
import { useContext } from "react";
import { LibraryContext } from "../../useFilters";
import { getDuration, getDurationString } from "./utils";
import { TestStatus } from "./TestStatus";
import { AttributeContainer } from "./AttributeContainer";

function Title({ testRun }: { testRun: TestRun }) {
  const title = testRun.commit?.title || "Unknown";
  const formatted = title.length > 80 ? title.slice(0, 80) + "..." : title;
  return (
    <div className="wrap flex shrink grow-0 flex-nowrap overflow-hidden text-ellipsis pr-2 font-semibold">
      {formatted}
    </div>
  );
}

function Attributes({ testRun, selected }: { testRun: TestRun; selected: boolean }) {
  const { recordings, branch, date } = testRun;
  const user = testRun.recordings[0].metadata.source?.trigger?.user;

  const duration = getDuration(testRun.recordings);
  const durationString = getDurationString(duration);
  const textColor = selected ? "text-gray-700" : "text-gray-500";
  const merge = recordings[0].metadata.source?.merge;
  return (
    <div className={`${textColor} flex flex-row items-center text-xs font-light`}>
      <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
      <AttributeContainer icon="person">{user!}</AttributeContainer>
      {merge && (
        <AttributeContainer title={merge.title} icon="merge_type">
          {merge.id}
        </AttributeContainer>
      )}
      {!merge && (
        <AttributeContainer maxWidth="160px" icon="fork_right">
          {branch}
        </AttributeContainer>
      )}
      {/* <AttributeContainer icon="play_circle">{testRun.event}</AttributeContainer> */}
      {/* <AttributeContainer icon="timer">{durationString}</AttributeContainer> */}
    </div>
  );
}

export function TestRunListItem({ testRun, onClick }: { testRun: TestRun; onClick: () => void }) {
  const { preview } = useContext(LibraryContext);
  const isSelected = preview?.id.toString() === testRun.id;
  const style = {
    backgroundColor: isSelected ? "rgb(209 238 255)" : "",
  };

  return (
    <div
      className="flex flex-grow cursor-pointer flex-row items-start space-x-3 overflow-hidden rounded-md border-b bg-white px-4 py-3 hover:bg-gray-100"
      style={style}
      onClick={onClick}
    >
      <TestStatus testRun={testRun} />
      <div className="flex flex-grow flex-col space-y-1">
        <div className="flex flex-row justify-between">
          <Title testRun={testRun} />
        </div>
        <Attributes selected={isSelected} testRun={testRun} />
      </div>
    </div>
  );
}
