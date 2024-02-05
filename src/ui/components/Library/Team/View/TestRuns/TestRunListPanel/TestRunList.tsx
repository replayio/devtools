import { useContext, useMemo } from "react";
import ReactVirtualizedAutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, ListChildComponentProps } from "react-window";

import { TestRun } from "shared/test-suites/TestRun";

import { TestSuitePanelMessage } from "../../TestSuitePanelMessage";
import { useTestRunsSuspends } from "../hooks/useTestRunsSuspends";
import { TestRunsContext } from "../TestRunsContextRoot";
import { TestRunListItem } from "./TestRunListItem";
import styles from "./TestRunList.module.css";

type ItemData = {
  filterByText: string;
  testRuns: TestRun[];
};

export function TestRunList() {
  const { filterByText } = useContext(TestRunsContext);
  const { filteredSortedTestRuns, rawTestRuns } = useTestRunsSuspends();
  const itemData = useMemo<ItemData>(
    () => ({
      filterByText,
      testRuns: filteredSortedTestRuns,
    }),
    [filterByText, filteredSortedTestRuns]
  );

  if (rawTestRuns.length > 0 && filteredSortedTestRuns.length === 0) {
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
