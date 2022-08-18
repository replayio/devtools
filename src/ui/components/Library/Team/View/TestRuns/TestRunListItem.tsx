import { TestRun } from "ui/hooks/tests";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getTruncatedRelativeDate } from "../Recordings/RecordingListItem/RecordingListItem";
import { useContext } from "react";
import { RunStats } from "./RunStats";
import { AttributeContainer } from "./AttributeContainer";
import styles from "../../../Library.module.css";
import Link from "next/link";
import { TeamContext } from "../../TeamContextRoot";
import { TestRunsContext } from "./TestRunsContextRoot";

function Title({ testRun }: { testRun: TestRun }) {
  const title = testRun.commitTitle || "Unknown";
  // TODO: This should be done in CSS.
  const formatted = title.length > 80 ? title.slice(0, 80) + "..." : title;

  return (
    <div className="flex pr-2 overflow-hidden font-medium wrap shrink grow-0 text-ellipsis whitespace-nowrap">
      {formatted}
    </div>
  );
}

function Attributes({ testRun }: { testRun: TestRun }) {
  const { mergeId, mergeTitle, user, date, branch } = testRun;

  return (
    <div className={`flex flex-row items-center text-xs font-light`}>
      <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
      <AttributeContainer icon="person">{user || ""}</AttributeContainer>
      {mergeId && (
        <AttributeContainer title={mergeTitle} icon="merge_type">
          {mergeId}
        </AttributeContainer>
      )}
      {!mergeId && (
        <AttributeContainer maxWidth="160px" icon="fork_right">
          {branch || ""}
        </AttributeContainer>
      )}
    </div>
  );
}

function Status({ failCount }: { failCount: number }) {
  return (
    <div className={`flex items-center  ${failCount > 0 ? "text-red-500" : "text-green-500"} `}>
      <MaterialIcon iconSize="2xl">{`${
        failCount > 0 ? "highlight_off" : "check_circle"
      } `}</MaterialIcon>
    </div>
  );
}

export function TestRunListItem({ testRun, onClick }: { testRun: TestRun; onClick: () => void }) {
  const { focusId } = useContext(TestRunsContext);
  const { teamId } = useContext(TeamContext);
  const failCount = testRun.stats?.failed || 0;
  const isSelected = focusId === testRun.id;

  return (
    <Link href={`/team/${teamId}/runs/${testRun.id}`}>
      <a
        className={`flex cursor-pointer flex-row items-center space-x-3 rounded-sm border-b border-chrome bg-themeBase-100 px-3 py-3 ${
          styles.libraryRow
        }     
      ${isSelected ? styles.libraryRowSelected : ""}
      `}
        onClick={onClick}
      >
        <Status failCount={failCount} />
        <div className="flex flex-col flex-grow space-y-1 overflow-hidden">
          <div className="flex flex-row justify-between space-x-3">
            <Title testRun={testRun} />
            <RunStats testRun={testRun} />
          </div>
          <Attributes testRun={testRun} />
        </div>
      </a>
    </Link>
  );
}
