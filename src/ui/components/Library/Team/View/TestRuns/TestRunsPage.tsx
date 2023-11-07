import { Suspense, useContext } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";

import { TestRunOverviewPage } from "./Overview/TestRunOverviewContextRoot";
import { TestRunList } from "./TestRunList";
import { TestRunsContext, TestRunsContextRoot } from "./TestRunsContextRoot";
import styles from "./TestRunsPage.module.css";

export function TestRunsPage() {
  return (
    <TestRunsContextRoot>
      <TestRunsContent />
    </TestRunsContextRoot>
  );
}

function TestRunsContent() {
  const {
    filterByBranch,
    filterByStatus,
    filterByText,
    filterByTextForDisplay,
    setFilterByBranch,
    setFilterByStatus,
    setFilterByText,
  } = useContext(TestRunsContext);

  const {
    contextMenu: contextMenuStatusFilter,
    onContextMenu: onClickStatusFilter,
    onKeyDown: onKeyDownStatusFilter,
  } = useContextMenu(
    <>
      <ContextMenuItem dataTestId="show-all-runs" onSelect={() => setFilterByStatus("all")}>
        All runs
      </ContextMenuItem>
      <ContextMenuItem dataTestId="show-only-failures" onSelect={() => setFilterByStatus("failed")}>
        Only failures
      </ContextMenuItem>
    </>,
    { alignTo: "auto-target" }
  );

  const {
    contextMenu: contextMenuBranchFilter,
    onContextMenu: onClickBranchFilter,
    onKeyDown: onKeyDownBranchFilter,
  } = useContextMenu(
    <>
      <ContextMenuItem dataTestId="show-all-branches" onSelect={() => setFilterByBranch("all")}>
        All branches
      </ContextMenuItem>
      <ContextMenuItem
        dataTestId="show-only-primary-branch"
        onSelect={() => setFilterByBranch("primary")}
      >
        Only primary branch
      </ContextMenuItem>
    </>,
    { alignTo: "auto-target" }
  );

  return (
    <div className="flex w-full flex-grow flex-row p-2">
      <PanelGroup autoSaveId="Library:TestRuns" direction="horizontal">
        <Panel minSize={20} order={1}>
          <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-bodyBgcolor">
            <div className="flex flex-row items-center justify-between gap-2 border-b border-themeBorder bg-bodyBgcolor p-2">
              <div
                className={styles.dropdownTrigger}
                data-test-id="TestRunsPage-ResultFilter-DropdownTrigger"
                onClick={onClickStatusFilter}
                onKeyDown={onKeyDownStatusFilter}
                tabIndex={0}
              >
                {filterByStatus === "all" ? "All runs" : "Only failures"}
                <Icon className="h-5 w-5" type="chevron-down" />
              </div>
              {contextMenuStatusFilter}
              <div
                className={styles.dropdownTrigger}
                data-test-id="TestRunsPage-BranchFilter-DropdownTrigger"
                onClick={onClickBranchFilter}
                onKeyDown={onKeyDownBranchFilter}
                tabIndex={0}
              >
                {filterByBranch === "all" ? "All branches" : "Only primary branch"}
                <Icon className="h-5 w-5" type="chevron-down" />
              </div>
              {contextMenuBranchFilter}
              <div className={styles.filterContainer}>
                <input
                  className={styles.filterInput}
                  data-test-id="TestRunsPage-FilterByText-Input"
                  onChange={event => setFilterByText(event.currentTarget.value)}
                  placeholder="Filter test runs"
                  type="text"
                  value={filterByTextForDisplay}
                />
                <Icon className={styles.searchIcon} type="search" />
              </div>
            </div>
            <div
              className="grow"
              data-filtered-by-status={filterByStatus}
              data-filtered-by-text={filterByText}
              data-test-id="TestRunList"
            >
              <Suspense fallback={<LibrarySpinner />}>
                <TestRunList />
              </Suspense>
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="h-full w-2" />
        <Panel minSize={20} order={2}>
          <div className="h-full w-full overflow-hidden rounded-xl">
            <Suspense fallback={<LibrarySpinner />}>
              <TestRunOverviewPage />
            </Suspense>
          </div>
        </Panel>
        <PanelResizeHandle className="h-full w-2" />
        <Panel minSize={20} order={2}>
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-white">
            <Suspense fallback={<LibrarySpinner />}>
              <div className="w-40 text-sm text-center">Select a test to see its details here</div>
            </Suspense>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
