import { TestRun } from "ui/hooks/tests";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getTruncatedRelativeDate } from "../../RecordingRow";
import { getDuration, getDurationString } from "./utils";
import { RunStats } from "./RunStats";
import { AttributeContainer } from "./AttributeContainer";
import styles from "../../Library.module.css";

function Title({ testRun }: { testRun: TestRun }) {
  const title = testRun.commit?.title || "Unknown";
  const formatted = title.length > 80 ? title.slice(0, 80) + "..." : title;
  return (
    <div className="flex pr-2 overflow-hidden font-medium wrap shrink grow-0 flex-nowrap text-ellipsis">
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
    <div className={`flex flex-row items-center text-xs font-light`}>
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
    </div>
  );
}

function Status({ failCount }: { failCount: number }) {
  return (
    <div className={`pt-0.5 flex self-start ${failCount > 0 ? "text-red-500" : "text-green-500"} `}>
      <MaterialIcon iconSize="xl">{`${failCount > 0 ? "cancel" : "check"} `}</MaterialIcon>
    </div>
  );
}

export function TestRunListItem({
  testRun,
  onClick,
  isSelected,
}: {
  testRun: TestRun;
  onClick: () => void;
  isSelected: boolean;
}) {
  const failCount = testRun.recordings.filter(r => r.metadata.test?.result !== "passed").length;

  return (
    <div
      className={`flex flex-grow cursor-pointer flex-row items-center space-x-3 overflow-hidden rounded-sm border-b border-chrome bg-themeBase-100 px-3 py-3 ${
        styles.libraryRow
      }     
      ${isSelected ? styles.libraryRowSelected : ""}
      `}
      onClick={onClick}
    >
      <Status failCount={failCount} />
      <div className="flex flex-col flex-grow space-y-1">
        <div className="flex flex-row justify-between">
          <Title testRun={testRun} />
          <RunStats testRun={testRun} />
        </div>
        <Attributes selected={isSelected} testRun={testRun} />
      </div>
    </div>
  );
}
