import { useContext, useMemo, useState } from "react";
import ReactVirtualizedAutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, ListChildComponentProps } from "react-window";

import { TestRun } from "shared/test-suites/TestRun";
import { TestRunListItem } from "ui/components/Library/Team/View/NewTestRuns/TestRunListItem";
import { SecondaryButton } from "ui/components/shared/Button";

import { TestSuitePanelMessage } from "../TestSuitePanelMessage";
import { TestRunsContext } from "./TestRunsContextRoot";
import styles from "./TestRunList.module.css";

const PAGE_SIZE = 50;

type ItemData = {
  countToRender: number;
  filterByText: string;
  loadMore: () => void;
  testRuns: TestRun[];
};

export function TestRunList() {
  const { filterByText, testRunsLoading, testRuns, testRunCount } = useContext(TestRunsContext);
  const [countToRender, setCountToRender] = useState(PAGE_SIZE);

  const itemData = useMemo<ItemData>(
    () => ({
      countToRender,
      filterByText,
      loadMore: () => setCountToRender(countToRender + PAGE_SIZE),
      testRuns,
    }),
    [countToRender, filterByText, testRuns]
  );

  const itemCount = Math.min(countToRender + 1, testRuns.length);

  if (!testRunsLoading && testRuns.length === 0 && testRunCount > 0) {
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
          itemCount={itemCount}
          itemData={itemData}
          itemSize={28}
          width={width}
        />
      )}
    />
  );
}

function TestRunListRow({ data, index, style }: ListChildComponentProps<ItemData>) {
  const { countToRender, filterByText, loadMore, testRuns } = data;

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
      <TestRunListItem filterByText={filterByText} testRun={testRuns[index]} />
    </div>
  );
}
