import Link from "next/link";
import { useContext } from "react";

import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { TestRun } from "ui/hooks/tests";

import { TeamContext } from "../../TeamContextRoot";
import { getTruncatedRelativeDate } from "../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "./AttributeContainer";
import { ModeAttribute } from "./Overview/RunSummary";
import { RunStats } from "./RunStats";
import { TestRunsContext } from "./TestRunsContextRoot";
import styles from "../../../Library.module.css";

function Title({ testRun }: { testRun: TestRun }) {
  const title = testRun.commitTitle || "Unknown";
  // TODO: This should be done in CSS.
  const formatted = title.length > 80 ? title.slice(0, 80) + "..." : title;

  return (
    <div className="wrap flex shrink grow-0 overflow-hidden text-ellipsis whitespace-nowrap pr-2 font-medium">
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
      <ModeAttribute testRun={testRun} />
    </div>
  );
}

function Status({ failCount }: { failCount: number }) {
  return (
    <Icon
      filename={failCount > 0 ? "testsuites-fail" : "testsuites-success"}
      size="medium"
      className={failCount > 0 ? "bg-[#EB5757]" : "bg-[#219653]"}
    />
  );
}

export function TestRunListItem({ testRun }: { testRun: TestRun }) {
  const { focusId } = useContext(TestRunsContext);
  const { teamId } = useContext(TeamContext);
  const failCount = testRun.stats?.failed || 0;
  const isSelected = focusId === testRun.id;

  return (
    <Link
      href={`/team/${teamId}/runs/${testRun.id}`}
      className={`flex cursor-pointer flex-row space-x-3 rounded-sm border-b border-chrome bg-themeBase-100 px-3 py-3 ${
        styles.libraryRow
      }     
      ${isSelected ? styles.libraryRowSelected : ""}
      `}
    >
      <Status failCount={failCount} />
      <div className="flex flex-grow flex-col space-y-1 overflow-hidden">
        <div className="flex flex-row justify-between space-x-3">
          <Title testRun={testRun} />
          <RunStats testRun={testRun} />
        </div>
        <Attributes testRun={testRun} />
        {testRun.title ? (
          <div className="flex flex-row items-center justify-between text-xs">{testRun.title}</div>
        ) : null}
      </div>
    </Link>
  );
}
