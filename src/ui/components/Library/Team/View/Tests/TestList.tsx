import { useContext, useMemo, useState } from "react";
import ReactVirtualizedAutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, ListChildComponentProps } from "react-window";

import { TestRun } from "shared/test-suites/TestRun";
import { TestListItem } from "ui/components/Library/Team/View/Tests/TestListItem";
import { SecondaryButton } from "ui/components/shared/Button";

import { TestsContext } from "./TestContextRoot";

const PAGE_SIZE = 50;
const ROW_HEIGHT = 65;

type ItemData = {
  countToRender: number;
  filterByText: string;
  loadMore: () => void;
  testRuns: TestRun[];
};

export function TestList() {
  const { filterByText, testRuns } = useContext(TestsContext);
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

  return (
    <ReactVirtualizedAutoSizer
      children={({ height, width }) => (
        <FixedSizeList
          children={TestListRow}
          className="no-scrollbar text-sm"
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
      <TestListItem filterByText={filterByText} testRun={testRuns[index]} />
    </div>
  );
}
