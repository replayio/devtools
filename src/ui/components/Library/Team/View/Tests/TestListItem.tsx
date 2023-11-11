import { useContext } from "react";

import { TestRun, getTestRunTitle } from "shared/test-suites/TestRun";
import HighlightedText from "ui/components/Library/Team/View/TestRuns/HighlightedText";
import Icon from "ui/components/shared/Icon";

import { TestContext } from "./TestContextRoot";
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

export function TestListItem({
  filterByText,
  testRun,
}: {
  filterByText: string;
  testRun: TestRun;
}) {
  const { date, source } = testRun;

  const { selectTestRun, testRunIdForDisplay } = useContext(TestContext);

  const title = getTestRunTitle(testRun);

  const failCount = testRun.results.counts.failed;
  const isSelected = testRunIdForDisplay === testRun.id;

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
      </div>
    </div>
  );
}
