import { useContext, useMemo } from "react";

import { Test } from "shared/test-suites/TestRun";
import HighlightedText from "ui/components/Library/Team/View/TestRuns/HighlightedText";
import Icon from "ui/components/shared/Icon";

import { TestContext } from "./TestContextRoot";
import styles from "./TestListItem.module.css";

function Status({ test }: { test: Test }) {
  const { sortBy } = useContext(TestContext);

  // We are showing rate in the pill depending on the sortBy.
  // If sortBy is failureRate or alphabetical, we show rate in this order of priority: failureRate, flakyRate, success.
  // Otherwise with sortBy flakyRate, we show rate in this order: flakyRate, failureRate, success.

  const { status, rate, classNames } = useMemo(() => {
    if (sortBy === "flakyRate" && test.flakyRate > 0) {
      return {
        status: "flaky",
        rate: test.flakyRate,
        classNames: styles.flakyPill,
      };
    } else if (test.failureRate > 0) {
      return {
        status: "failure",
        rate: test.failureRate,
        classNames: styles.failedPill,
      };
    } else {
      return { status: "success", rate: 0, classNames: "" };
    }
  }, [sortBy, test.failureRate, test.flakyRate]);

  const displayedFailureRate = Number((rate * 100).toFixed(0));

  if (rate > 0) {
    return (
      <div
        className={`flex h-5 w-10 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white ${classNames}`}
        data-test-status={status}
        title={`${displayedFailureRate === 100 ? "100" : displayedFailureRate.toFixed(2)}%`}
      >
        {displayedFailureRate}%
      </div>
    );
  } else {
    return (
      <div className="flex h-5 w-10 shrink-0 items-center justify-center" data-test-status={status}>
        <Icon className={styles.testsuitesSuccess} filename={"testsuites-success"} size="medium" />
      </div>
    );
  }
}

export function TestListItem({ filterByText, test }: { filterByText: string; test: Test }) {
  const { selectTestId, testIdForDisplay } = useContext(TestContext);
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
      <Status test={test} />
      <div className="flex h-full flex-grow flex-col justify-evenly overflow-hidden">
        <div className="flex flex-row justify-between space-x-3">
          <div
            className="wrap flex shrink grow-0 overflow-hidden text-ellipsis whitespace-nowrap pr-2 font-medium"
            data-test-id="Test-Title"
          >
            <HighlightedText haystack={test.title} needle={filterByText} />
          </div>
        </div>
      </div>
    </div>
  );
}
