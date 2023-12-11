import { Suspense, useContext } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";

import { FilterField } from "./FilterField";
import { TestRunOverviewPage } from "./Overview/TestRunOverviewContextRoot";
import { TestRunList } from "./TestRunList";
import {
  TestRunsContext,
  TestRunsContextRoot,
  TestRunsFilterContext,
  TestRunsFilterContextRoot,
} from "./TestRunsContextRoot";
import { TestRunSpecDetails } from "./TestRunSpecDetails";
import styles from "../../../Library.module.css";
import dropdownStyles from "./Dropdown.module.css";

export function TestRunsPage() {
  return (
    <TestRunsFilterContextRoot>
      <TestRunsContextRoot>
        <TestRunsContent />
      </TestRunsContextRoot>
    </TestRunsFilterContextRoot>
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
    testRunsLoading,
  } = useContext(TestRunsContext);
  const { filterByTime, setFilterByTime } = useContext(TestRunsFilterContext);

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
    contextMenu: contextMenuTimeFilter,
    onContextMenu: onClickTimeFilter,
    onKeyDown: onKeyDownTimeFilter,
  } = useContextMenu(
    <>
      <ContextMenuItem dataTestId="week" onSelect={() => setFilterByTime("week")}>
        This week
      </ContextMenuItem>
      <ContextMenuItem dataTestId="month" onSelect={() => setFilterByTime("month")}>
        This month
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
    <div className="flex w-full flex-grow flex-row p-1">
      <PanelGroup autoSaveId="Library:TestRuns" direction="horizontal">
        <Panel minSize={20} order={1}>
          <div className="flex h-full w-full flex-col gap-4 overflow-hidden rounded-xl bg-bodyBgcolor p-2">
            <div className="flex flex-col gap-2">
              <div className="grid w-full grid-cols-3 gap-2 overflow-hidden bg-bodyBgcolor">
                <div
                  className={dropdownStyles.dropdownTrigger}
                  data-test-id="TestRunsPage-ResultFilter-DropdownTrigger"
                  onClick={onClickStatusFilter}
                  onKeyDown={onKeyDownStatusFilter}
                  tabIndex={0}
                >
                  <div className="truncate">
                    {filterByStatus === "all" ? "All runs" : "Only failures"}
                  </div>
                  <Icon className="h-5 w-5 flex-shrink-0" type="chevron-down" />
                </div>
                {contextMenuStatusFilter}
                <div
                  className={dropdownStyles.dropdownTrigger}
                  data-test-id="TestRunsPage-TimeFilter-DropdownTrigger"
                  onClick={onClickTimeFilter}
                  onKeyDown={onKeyDownTimeFilter}
                  tabIndex={0}
                >
                  <div className="truncate">
                    {filterByTime === "week" ? "This week" : "This month"}
                  </div>
                  <Icon className="h-5 w-5 flex-shrink-0" type="chevron-down" />
                </div>
                {contextMenuTimeFilter}
                <div
                  className={dropdownStyles.dropdownTrigger}
                  data-test-id="TestRunsPage-BranchFilter-DropdownTrigger"
                  onClick={onClickBranchFilter}
                  onKeyDown={onKeyDownBranchFilter}
                  tabIndex={0}
                >
                  <div className="truncate">
                    {filterByBranch === "all" ? "All branches" : "Only primary branch"}
                  </div>
                  <Icon className="h-5 w-5 flex-shrink-0" type="chevron-down" />
                </div>
                {contextMenuBranchFilter}
              </div>
              <FilterField
                placeholder="Filter"
                onChange={setFilterByText}
                value={filterByTextForDisplay}
              />
            </div>
            <div
              className="grow"
              data-filtered-by-status={filterByStatus}
              data-filtered-by-text={filterByText}
              data-test-id="TestRunList"
            >
              {testRunsLoading ? (
                <div className="flex h-full items-center justify-center">
                  <LibrarySpinner />
                </div>
              ) : (
                <TestRunList />
              )}
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="h-full w-1" />
        <Panel minSize={20} order={2}>
          <div
            className={`flex h-full w-full items-center justify-center overflow-hidden rounded-xl ${styles.testReplayDetails}`}
          >
            <Suspense fallback={<LibrarySpinner />}>
              <TestRunOverviewPage />
            </Suspense>
          </div>
        </Panel>
        <PanelResizeHandle className="h-full w-1" />
        <Panel minSize={20} order={2}>
          <div
            className={`flex h-full w-full items-center justify-center overflow-hidden rounded-xl ${styles.testReplayDetails}`}
          >
            <Suspense fallback={<LibrarySpinner />}>
              <TestRunSpecDetails />
            </Suspense>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
