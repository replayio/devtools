import { useContext, useMemo } from "react";
import ReactVirtualizedAutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, ListChildComponentProps } from "react-window";

import { TestRun, filterTestRun, getTestRunTitle } from "shared/test-suites/TestRun";

import { TestSuitePanelMessage } from "../../TestSuitePanelMessage";
import { useTestRunSuspends } from "../hooks/useTestRunSuspends";
import { TestRunsContext } from "../TestRunsContextRoot";
import { TestRunListItem } from "./TestRunListItem";
import styles from "./TestRunList.module.css";

type ItemData = {
  filterByText: string;
  testRuns: TestRun[];
};

export function TestRunList() {
  const { filterByText, filterByBranch, filterByStatus } = useContext(TestRunsContext);
  const { testRuns } = useTestRunSuspends();
  const itemData = useMemo<ItemData>(() => {
    let filteredTestRuns = testRuns;

    if (filterByBranch === "primary" || filterByStatus === "failed" || filterByText !== "") {
      filteredTestRuns = filteredTestRuns.filter(testRun =>
        filterTestRun(testRun, {
          branch: filterByBranch,
          text: filterByText,
          status: filterByStatus,
        })
      );
    }

    return {
      filterByText,
      testRuns: filteredTestRuns,
    };
  }, [filterByBranch, filterByStatus, filterByText, testRuns]);

  if (testRuns.length > 0 && itemData.testRuns.length === 0) {
    return (
      <TestSuitePanelMessage data-test-id="NoTestRuns" className={styles.message}>
        No test runs match the current filters
      </TestSuitePanelMessage>
    );
  }

  return (
    <ReactVirtualizedAutoSizer
      children={({ height, width }) => (
        <FixedSizeList
          children={TestRunListRow}
          className="text-sm"
          height={height}
          itemCount={itemData.testRuns.length}
          itemData={itemData}
          itemSize={28}
          width={width}
        />
      )}
    />
  );
}

function TestRunListRow({ data, index, style }: ListChildComponentProps<ItemData>) {
  const { filterByText, testRuns } = data;

  return (
    <div style={style}>
      <TestRunListItem filterByText={filterByText} testRun={testRuns[index]} />
    </div>
  );
}
