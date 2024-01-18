import { useContext, useMemo } from "react";

import { Test } from "shared/test-suites/TestRun";
import Icon from "ui/components/shared/Icon";

import HighlightedText from "../../HighlightedText";
import { TestRunLibraryRow } from "../../TestRuns/TestRunLibraryRow";
import { TestContext } from "../TestContextRoot";
import styles from "./TestListItem.module.css";

function Status({ test }: { test: Test }) {
  const { sortBy } = useContext(TestContext);

  const { status, rate, classNames } = useMemo(() => {
    if (sortBy === "flakyRate") {
      return { status: "flaky", rate: test.flakyRate, classNames: styles.flakyPill };
    } else if (test.failureRate > 0) {
      // sortBy could be "failureRate" or "alphabetical", show failure rate in that case
      return { status: "failure", rate: test.failureRate, classNames: styles.failedPill };
    } else {
      return { status: "success", rate: 0, classNames: "" };
    }
  }, [sortBy, test.failureRate, test.flakyRate]);

  const displayedFailureRate = Number((rate * 100).toFixed(0));

  if (status === "success") {
    return (
      <div className="flex h-5 w-10 shrink-0 items-center justify-center" data-test-status={status}>
        <Icon className={styles.testsuitesSuccess} filename={"testsuites-success"} size="medium" />
      </div>
    );
  } else {
    return (
      <div
        className={`flex h-5 w-10 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white ${classNames}`}
        data-test-status={status}
        title={`${displayedFailureRate === 100 ? "100" : displayedFailureRate.toFixed(2)}%`}
      >
        {displayedFailureRate}%
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
    <TestRunLibraryRow
      isSelected={isSelected}
      data-test-id="TestListItem"
      className="cursor-pointer space-x-3 border-b border-chrome p-3"
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
    </TestRunLibraryRow>
  );
}
