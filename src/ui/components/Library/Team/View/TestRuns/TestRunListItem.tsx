import { useContext } from "react";

import { TestRun, getTestRunTitle } from "shared/test-suites/TestRun";
import { BranchIcon } from "ui/components/Library/Team/View/TestRuns/BranchIcon";
import HighlightedText from "ui/components/Library/Team/View/TestRuns/HighlightedText";
import Icon from "ui/components/shared/Icon";

import { getTruncatedRelativeDate } from "../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "./AttributeContainer";
import { ModeAttribute } from "./Overview/RunSummary";
import { TestRunsContext } from "./TestRunsContextRoot";
import styles from "../../../Library.module.css";

function Status({ failCount }: { failCount: number }) {
  const status = failCount > 0 ? "fail" : "success";

  if (failCount > 0) {
    return (
      <div
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#F02D5E] text-xs font-bold text-chrome"
        data-test-status={status}
      >
        {failCount}
      </div>
    );
  } else {
    return (
      <div data-test-status={status}>
        <Icon className={styles.testsuitesSuccess} filename={"testsuites-success"} size="medium" />
      </div>
    );
  }
}

export function TestRunListItem({
  filterByText,
  testRun,
}: {
  filterByText: string;
  testRun: TestRun;
}) {
  const { date, source } = testRun;

  const { selectTestRun, testRunIdForDisplay } = useContext(TestRunsContext);

  const title = getTestRunTitle(testRun);

  const failCount = testRun.results.counts.failed;
  const isSelected = testRunIdForDisplay === testRun.id;

  let attributes;
  if (source) {
    const { branchName, isPrimaryBranch, user } = source;

    attributes = (
      <div className="flex flex-row items-center gap-4 text-xs font-light">
        <AttributeContainer dataTestId="TestRun-Date" icon="schedule" title={date.toLocaleString()}>
          {getTruncatedRelativeDate(date)}
        </AttributeContainer>
        {user && (
          <AttributeContainer dataTestId="TestRun-Username" icon="person">
            <HighlightedText haystack={user} needle={filterByText} />
          </AttributeContainer>
        )}
        <BranchIcon
          branchName={<HighlightedText haystack={branchName || ""} needle={filterByText} />}
          isPrimaryBranch={isPrimaryBranch}
          title={title}
        />
        <ModeAttribute testRun={testRun} />
      </div>
    );
  } else {
    attributes = (
      <div className="flex flex-row items-center gap-4 text-xs font-light">
        <AttributeContainer dataTestId="TestRun-Date" icon="schedule">
          {getTruncatedRelativeDate(date)}
        </AttributeContainer>
      </div>
    );
  }

  const onClick = () => {
    selectTestRun(testRun.id);
  };

  return (
    <div
      data-test-id="TestRunListItem"
      className={`flex cursor-pointer flex-row items-center space-x-3 rounded-sm border-b border-chrome bg-themeBase-100 p-3 ${
        styles.libraryRow
      }
      ${isSelected ? styles.libraryRowSelected : ""}
      `}
      onClick={onClick}
    >
      <Status failCount={failCount} />

      <div className="flex h-full flex-grow flex-col justify-evenly overflow-hidden">
        <div className="flex flex-row justify-between space-x-3">
          <div
            className="wrap flex shrink grow-0 overflow-hidden text-ellipsis whitespace-nowrap pr-2 font-medium"
            data-test-id="TestRun-Title"
          >
            <HighlightedText haystack={title} needle={filterByText} />
          </div>
        </div>
        {attributes}
      </div>
    </div>
  );
}
