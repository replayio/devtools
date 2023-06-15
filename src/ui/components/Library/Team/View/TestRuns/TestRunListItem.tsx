import Link from "next/link";
import { useContext } from "react";

import { Summary, getTestRunTitle } from "shared/test-suites/TestRun";
import { BranchIcon } from "ui/components/Library/Team/View/TestRuns/BranchIcon";
import Icon from "ui/components/shared/Icon";

import { TeamContext } from "../../TeamContextRoot";
import { getTruncatedRelativeDate } from "../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "./AttributeContainer";
import { ModeAttribute } from "./Overview/RunSummary";
import { RunStats } from "./RunStats";
import { TestRunsContext } from "./TestRunsContextRoot";
import styles from "../../../Library.module.css";

function Title({ summary }: { summary: Summary }) {
  const title = getTestRunTitle(summary);

  // TODO: This should be done in CSS.
  const formatted = title.length > 80 ? title.slice(0, 80) + "..." : title;

  return (
    <div className="wrap flex shrink grow-0 overflow-hidden text-ellipsis whitespace-nowrap pr-2 font-medium">
      {formatted}
    </div>
  );
}

function Attributes({ summary }: { summary: Summary }) {
  const { date, source } = summary;

  const title = getTestRunTitle(summary);

  if (source) {
    const { branchName, isPrimaryBranch, user } = source;

    return (
      <div className="flex flex-row items-center gap-4 text-xs font-light">
        <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
        {user && <AttributeContainer icon="person">{user}</AttributeContainer>}
        <BranchIcon branchName={branchName} isPrimaryBranch={isPrimaryBranch} title={title} />
        <ModeAttribute summary={summary} />
      </div>
    );
  } else {
    return (
      <div className="flex flex-row items-center gap-4 text-xs font-light">
        <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
      </div>
    );
  }
}

function Status({ failCount }: { failCount: number }) {
  if (failCount > 0) {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#EB5757] text-xs font-bold text-chrome">
        {failCount}
      </div>
    );
  } else {
    return (
      <Icon
        filename={failCount > 0 ? "testsuites-fail" : "testsuites-success"}
        size="medium"
        className={failCount > 0 ? "bg-[#EB5757]" : "bg-[#219653]"}
      />
    );
  }
}

export function TestRunListItem({ summary }: { summary: Summary }) {
  const { focusId } = useContext(TestRunsContext);
  const { teamId } = useContext(TeamContext);

  // TODO Don't count flakes
  const failCount = summary.results.counts.failed;
  const isSelected = focusId === summary.id;

  return (
    <Link
      href={`/team/${teamId}/runs/${summary.id}`}
      className={`flex h-full cursor-pointer flex-row items-center space-x-3 rounded-sm border-b border-chrome bg-themeBase-100 px-3 ${
        styles.libraryRow
      }
      ${isSelected ? styles.libraryRowSelected : ""}
      `}
    >
      <Status failCount={failCount} />
      <div className="flex h-full flex-grow flex-col justify-evenly overflow-hidden">
        <div className="flex flex-row justify-between space-x-3">
          <Title summary={summary} />
          <RunStats summary={summary} />
        </div>
        <Attributes summary={summary} />
      </div>
    </Link>
  );
}
