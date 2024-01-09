import { useContext, useMemo, useState } from "react";
import ReactVirtualizedAutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, ListChildComponentProps } from "react-window";

import { Test } from "shared/test-suites/TestRun";
import { TestListItem } from "ui/components/Library/Team/View/Tests/TestListItem";
import { SecondaryButton } from "ui/components/shared/Button";

import { TestSuitePanelMessage } from "../TestSuitePanelMessage";
import { TestContext } from "./TestContextRoot";
import styles from "./TestList.module.css";

const PAGE_SIZE = 50;
const ROW_HEIGHT = 45;

type ItemData = {
  countToRender: number;
  filterByText: string;
  loadMore: () => void;
  tests: Test[];
};

export function TestList() {
  const { tests, testsCount, testsLoading, filterByText } = useContext(TestContext);
  const [countToRender, setCountToRender] = useState(PAGE_SIZE);

  const itemData = useMemo<ItemData>(
    () => ({
      countToRender,
      filterByText,
      loadMore: () => setCountToRender(countToRender + PAGE_SIZE),
      tests,
    }),
    [countToRender, tests, filterByText]
  );

  const itemCount = Math.min(countToRender + 1, tests.length);

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
          itemCount={itemCount}
          itemData={itemData}
          itemSize={ROW_HEIGHT}
          width={width}
        />
      )}
    />
  );
}

function TestListRow({ data, index, style }: ListChildComponentProps<ItemData>) {
  const { countToRender, filterByText, loadMore, tests } = data;

  if (index === countToRender) {
    return (
      <div className="flex justify-center p-4" style={style}>
        <SecondaryButton className="" color="blue" onClick={loadMore}>
          Show More
        </SecondaryButton>
      </div>
    );
  }

  return (
    <div style={style}>
      <TestListItem filterByText={filterByText} test={tests[index]} />
    </div>
  );
}
