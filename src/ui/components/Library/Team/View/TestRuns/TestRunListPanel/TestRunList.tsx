import { useContext, useMemo } from "react";
import ReactVirtualizedAutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, ListChildComponentProps } from "react-window";

import { TestRun, getTestRunTitle } from "shared/test-suites/TestRun";

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
  const filteredTestRuns = useMemo(() => {
    let filteredTestRuns = testRuns;

    if (filterByBranch === "primary" || filterByStatus === "failed" || filterByText !== "") {
      const lowerCaseText = filterByText.toLowerCase();

      filteredTestRuns = filteredTestRuns.filter(testRun => {
        if (filterByStatus === "failed") {
          if (testRun.results.counts.failed === 0) {
            return false;
          }
        }

        const branchName = testRun.source?.branchName ?? "";

        if (filterByBranch === "primary") {
          // TODO This should be configurable by Workspace
          if (branchName !== "main" && branchName !== "master") {
            return false;
          }
        }

        if (filterByText !== "") {
          const user = testRun.source?.user ?? "";
          const title = getTestRunTitle(testRun);

          if (
            !branchName.toLowerCase().includes(lowerCaseText) &&
            !user.toLowerCase().includes(lowerCaseText) &&
            !title.toLowerCase().includes(lowerCaseText)
          ) {
            return false;
          }
        }

        return true;
      });
    }

    return filteredTestRuns;
  }, [filterByBranch, filterByStatus, filterByText, testRuns]);

  const itemData = useMemo<ItemData>(
    () => ({
      filterByText,
      testRuns,
    }),
    [filterByText, testRuns]
  );

  if (testRuns.length > 0 && filteredTestRuns.length === 0) {
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
          itemCount={testRuns.length}
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
