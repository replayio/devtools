import { useContext, useMemo } from "react";
import ReactVirtualizedAutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, ListChildComponentProps } from "react-window";

import { Test } from "shared/test-suites/TestRun";

import { TestSuitePanelMessage } from "../../TestSuitePanelMessage";
import { TestContext } from "../TestContextRoot";
import { TestListItem } from "./TestListItem";
import styles from "./TestList.module.css";

const ROW_HEIGHT = 45;

type ItemData = {
  filterByText: string;
  tests: Test[];
};

export function TestList() {
  const { tests, testsCount, testsLoading, filterByText } = useContext(TestContext);

  const itemData = useMemo<ItemData>(
    () => ({
      filterByText,
      tests,
    }),
    [tests, filterByText]
  );

  if (!testsLoading && tests.length === 0 && testsCount > 0) {
    return (
      <TestSuitePanelMessage data-test-id="NoTestMatches" className={styles.message}>
        No tests match the current filters
      </TestSuitePanelMessage>
    );
  }

  return (
    <ReactVirtualizedAutoSizer
      children={({ height, width }) => (
        <FixedSizeList
          children={TestListRow}
          className="text-sm"
          height={height}
          itemCount={tests.length}
          itemData={itemData}
          itemSize={ROW_HEIGHT}
          width={width}
        />
      )}
    />
  );
}

function TestListRow({ data, index, style }: ListChildComponentProps<ItemData>) {
  const { filterByText, tests } = data;

  return (
    <div style={style}>
      <TestListItem filterByText={filterByText} test={tests[index]} />
    </div>
  );
}
