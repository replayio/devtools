import Link from "next/link";
import { useContext } from "react";

import { TestSuite } from "shared/test-suites/types";
import Icon from "ui/components/shared/Icon";

import { TeamContext } from "../../TeamContextRoot";
import { getTruncatedRelativeDate } from "../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "./AttributeContainer";
import { ModeAttribute } from "./Overview/RunSummary";
import { RunStats } from "./RunStats";
import { TestRunsContext } from "./TestRunsContextRoot";
import styles from "../../../Library.module.css";

function Title({ testSuite }: { testSuite: TestSuite }) {
  const title = testSuite.title;

  // TODO: This should be done in CSS.
  const formatted = title.length > 80 ? title.slice(0, 80) + "..." : title;

  return (
    <div className="wrap flex shrink grow-0 overflow-hidden text-ellipsis whitespace-nowrap pr-2 font-medium">
      {formatted}
    </div>
  );
}

function Attributes({ testSuite }: { testSuite: TestSuite }) {
  const { date, source, title } = testSuite;
  if (source) {
    const { branchName, branchStatus, user } = source;

    return (
      <div className="flex flex-row items-center text-xs font-light">
        <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
        <AttributeContainer icon="person">{user}</AttributeContainer>
        {branchStatus === "open" ? (
          <AttributeContainer maxWidth="160px" icon="fork_right">
            {branchName}
          </AttributeContainer>
        ) : (
          <AttributeContainer title={title} icon="merge_type">
            {branchStatus}
          </AttributeContainer>
        )}
        <ModeAttribute testSuite={testSuite} />
      </div>
    );
  } else {
    return (
      <div className="flex flex-row items-center text-xs font-light">
        <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
      </div>
    );
  }
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

export function TestRunListItem({ testSuite }: { testSuite: TestSuite }) {
  const { focusId } = useContext(TestRunsContext);
  const { teamId } = useContext(TeamContext);

  // TODO Don't count flakes
  const failCount = testSuite.results.counts.failed;
  const isSelected = focusId === testSuite.id;

  return (
    <Link
      href={`/team/${teamId}/runs/${testSuite.id}`}
      className={`flex h-full cursor-pointer flex-row items-center space-x-3 rounded-sm border-b border-chrome bg-themeBase-100 px-3 ${
        styles.libraryRow
      }
      ${isSelected ? styles.libraryRowSelected : ""}
      `}
    >
      <Status failCount={failCount} />
      <div className="flex h-full flex-grow flex-col justify-evenly overflow-hidden">
        <div className="flex flex-row justify-between space-x-3">
          <Title testSuite={testSuite} />
          <RunStats testSuite={testSuite} />
        </div>
        <Attributes testSuite={testSuite} />
      </div>
    </Link>
  );
}
