import { useContext, useMemo, useState } from "react";
import ReactVirtualizedAutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, ListChildComponentProps } from "react-window";

import { Summary, getTestRunTitle } from "shared/test-suites/TestRun";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import { TestRunListItem } from "ui/components/Library/Team/View/TestRuns/TestRunListItem";
import { SecondaryButton } from "ui/components/shared/Button";

import { TestRunsContext } from "./TestRunsContextRoot";

const PAGE_SIZE = 50;
const ROW_HEIGHT = 70;

type ItemData = {
  countToRender: number;
  loadMore: () => void;
  summaries: Summary[];
};

export function TestRunList({
  filterByText,
  mode,
}: {
  filterByText: string;
  mode: "all" | "failed";
}) {
  const { loading, summaries } = useContext(TestRunsContext);
  const [countToRender, setCountToRender] = useState(PAGE_SIZE);

  const filteredSummaries = useMemo(() => {
    let filteredSummaries = summaries;

    if (mode === "failed") {
      filteredSummaries = filteredSummaries.filter(summary => summary.results.counts.failed > 0);
    }

    if (filterByText !== "") {
      const lowerCaseText = filterByText.toLowerCase();

      filteredSummaries = filteredSummaries.filter(summary => {
        const branchName = summary.source?.branchName ?? "";
        const user = summary.source?.user ?? "";

        const title = getTestRunTitle(summary);

        return (
          branchName.toLowerCase().includes(lowerCaseText) ||
          user.toLowerCase().includes(lowerCaseText) ||
          title.toLowerCase().includes(lowerCaseText)
        );
      });
    }

    return filteredSummaries;
  }, [filterByText, mode, summaries]);

  const itemData = useMemo<ItemData>(
    () => ({
      countToRender,
      loadMore: () => setCountToRender(countToRender + PAGE_SIZE),
      summaries: filteredSummaries,
    }),
    [countToRender, filteredSummaries]
  );

  if (loading) {
    return <LibrarySpinner />;
  }

  const itemCount = Math.min(countToRender + 1, filteredSummaries.length);

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
  const { countToRender, loadMore, summaries: summary } = data;

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
      <TestRunListItem summary={summary[index]} />
    </div>
  );
}
