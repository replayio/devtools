import { useContext, useMemo, useState } from "react";
import ReactVirtualizedAutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, ListChildComponentProps } from "react-window";

import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import { TestRunListItem } from "ui/components/Library/Team/View/TestRuns/TestRunListItem";
import { SecondaryButton } from "ui/components/shared/Button";
import { TestRun } from "ui/hooks/tests";

import { TestRunsContext } from "./TestRunsContextRoot";

const PAGE_SIZE = 50;
const ROW_HEIGHT = 70;

type ItemData = {
  countToRender: number;
  loadMore: () => void;
  testRuns: TestRun[];
};

export function TestRunList() {
  const { loading, testRuns } = useContext(TestRunsContext);
  const [countToRender, setCountToRender] = useState(PAGE_SIZE);

  const itemData = useMemo<ItemData>(
    () => ({
      countToRender,
      loadMore: () => setCountToRender(countToRender + PAGE_SIZE),
      testRuns,
    }),
    [countToRender, testRuns]
  );

  if (loading) {
    return <LibrarySpinner />;
  }

  const itemCount = Math.min(countToRender + 1, testRuns.length);

  return (
    <ReactVirtualizedAutoSizer
      children={({ height, width }) => (
        <FixedSizeList
          children={TestRunListRow}
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

function TestRunListRow({ data, index, style }: ListChildComponentProps<ItemData>) {
  const { countToRender, loadMore, testRuns } = data;

  if (index === countToRender) {
    return (
      <div className="flex justify-center p-4" style={style}>
        <SecondaryButton className="" color="blue" onClick={loadMore}>
          Show More
        </SecondaryButton>
      </div>
    );
  }

  const testRun = testRuns[index];
  return (
    <div style={style}>
      <TestRunListItem testRun={testRun} />
    </div>
  );
}
