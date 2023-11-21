import { useContext } from "react";

import { Test } from "shared/test-suites/TestRun";
import HighlightedText from "ui/components/Library/Team/View/TestRuns/HighlightedText";
import Icon from "ui/components/shared/Icon";

import { TestContext } from "./TestContextRoot";
import styles from "../../../Library.module.css";

function Status({ failureRate }: { failureRate: number }) {
  const status = failureRate > 0 ? "fail" : "success";
  const displayedFailureRate = Number((failureRate * 100).toFixed(0));

  if (failureRate > 0) {
    return (
      <div
        className="flex h-5 w-8 shrink-0 items-center justify-center rounded-md bg-[#F02D5E] text-xs font-bold text-white"
        data-test-status={status}
      >
        {displayedFailureRate}
      </div>
    );
  } else {
    return (
      <div data-test-status={status}>
        {failureRate}
        <Icon className={styles.testsuitesSuccess} filename={"testsuites-success"} size="medium" />
      </div>
    );
  }
}

export function TestListItem({ filterByText, test }: { filterByText: string; test: Test }) {
  const { selectTestId, testIdForDisplay } = useContext(TestContext);
  const { title, failureRate } = test;
  const isSelected = testIdForDisplay === test.testId;

  const onClick = () => {
    selectTestId(test.testId);
  };

  return (
    <div
      data-test-id="TestListItem"
      className={`flex cursor-pointer flex-row items-center space-x-3 rounded-sm border-b border-chrome bg-themeBase-100 p-3 ${
        styles.libraryRow
      }
      ${isSelected ? styles.libraryRowSelected : ""}
      `}
      onClick={onClick}
    >
      <Status failureRate={failureRate} />
      <div className="flex h-full flex-grow flex-col justify-evenly overflow-hidden">
        <div className="flex flex-row justify-between space-x-3">
          <div
            className="wrap flex shrink grow-0 overflow-hidden text-ellipsis whitespace-nowrap pr-2 font-medium"
            data-test-id="Test-Title"
          >
            <HighlightedText haystack={title} needle={filterByText} />
          </div>
        </div>
      </div>
    </div>
  );
}
