import Link from "next/link";
import { useContext } from "react";

import { Summary, getTestRunTitle } from "shared/test-suites/TestRun";
import { BranchIcon } from "ui/components/Library/Team/View/TestRuns/BranchIcon";
import HighlightedText from "ui/components/Library/Team/View/TestRuns/HighlightedText";
import Icon from "ui/components/shared/Icon";

import { TeamContext } from "../../TeamContextRoot";
import { getTruncatedRelativeDate } from "../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "./AttributeContainer";
import { ModeAttribute } from "./Overview/RunSummary";
import { RunStats } from "./RunStats";
import { TestRunsContext } from "./TestRunsContextRoot";
import styles from "../../../Library.module.css";

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

export function TestRunListItem({
  filterByText,
  summary,
}: {
  filterByText: string;
  summary: Summary;
}) {
  const { date, source } = summary;

  const { focusId } = useContext(TestRunsContext);
  const { teamId } = useContext(TeamContext);

  const title = getTestRunTitle(summary);

  const failCount = summary.results.counts.failed;
  const isSelected = focusId === summary.id;

  let attributes;
  if (source) {
    const { branchName, isPrimaryBranch, user } = source;

    attributes = (
      <div className="flex flex-row items-center gap-4 text-xs font-light">
        <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
        {user && (
          <AttributeContainer icon="person">
            <HighlightedText haystack={user} needle={filterByText} />
          </AttributeContainer>
        )}
        <BranchIcon
          branchName={<HighlightedText haystack={branchName || ""} needle={filterByText} />}
          isPrimaryBranch={isPrimaryBranch}
          title={title}
        />
        <ModeAttribute summary={summary} />
      </div>
    );
  } else {
    attributes = (
      <div className="flex flex-row items-center gap-4 text-xs font-light">
        <AttributeContainer icon="schedule">{getTruncatedRelativeDate(date)}</AttributeContainer>
      </div>
    );
  }

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
          <div className="wrap flex shrink grow-0 overflow-hidden text-ellipsis whitespace-nowrap pr-2 font-medium">
            <HighlightedText haystack={title} needle={filterByText} />
          </div>
          <RunStats summary={summary} />
        </div>
        {attributes}
      </div>
    </Link>
  );
}
