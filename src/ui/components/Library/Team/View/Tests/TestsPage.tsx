import { Suspense, useContext } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import LibraryDropdownTrigger from "ui/components/Library/LibraryDropdownTrigger";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";

import { TestOverviewContent } from "./Overview/TestOverviewContent";
import { TestContext, TestsContextRoot } from "./TestContextRoot";
import { TestList } from "./TestList";
import styles from "./TestsPage.module.css";

export function TestsPage() {
  return (
    <TestsContextRoot>
      <TestsContent />
    </TestsContextRoot>
  );
}

function TestsContent() {
  const {
    filterByText,
    setFilterByText,
    filterByTime,
    setFilterByTime,
    filterByTextForDisplay,
    sortBy,
    setSortBy,
  } = useContext(TestContext);

  const {
    contextMenu: contextMenuSortBy,
    onContextMenu: onClickSortBy,
    onKeyDown: onKeyDownSortBy,
  } = useContextMenu(
    <>
      <ContextMenuItem onSelect={() => setSortBy("failureRate")}>
        Sort by failure rate
      </ContextMenuItem>
      <ContextMenuItem disabled onSelect={() => setSortBy("alphabetical")}>
        Sort alphabetically
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
      <ContextMenuItem disabled onSelect={() => setFilterByTime(1 / 24)}>
        Last hour
      </ContextMenuItem>
      <ContextMenuItem disabled onSelect={() => setFilterByTime(1)}>
        Last day
      </ContextMenuItem>
      <ContextMenuItem disabled onSelect={() => setFilterByTime(7)}>
        Last week
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => setFilterByTime(null)}>All time</ContextMenuItem>
    </>,
    { alignTo: "auto-target" }
  );

  return (
    <div className="flex w-full flex-grow flex-row p-2">
      <PanelGroup autoSaveId="Library:Tests" direction="horizontal">
        <Panel minSizePercentage={20} order={1}>
          <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-bodyBgcolor">
            <div className="flex flex-row items-center justify-between gap-2 border-b border-themeBorder bg-bodyBgcolor p-2">
              <LibraryDropdownTrigger
                testId="TestPage-ResultFilter-DropdownTrigger"
                onKeyDown={onKeyDownSortBy}
                onClick={onClickSortBy}
                label={sortBy === "failureRate" ? "Sort by failure rate" : ""}
              />
              {contextMenuSortBy}
              <LibraryDropdownTrigger
                testId="TestPage-BranchFilter-DropdownTrigger"
                onClick={onClickTimeFilter}
                onKeyDown={onKeyDownTimeFilter}
                label={filterByTime === null ? "All time" : ""}
              />
              {contextMenuTimeFilter}
              <div className={styles.filterContainer}>
                <input
                  className={styles.filterInput}
                  data-test-id="TestPage-FilterByText-Input"
                  onChange={event => setFilterByText(event.currentTarget.value)}
                  placeholder="Filter tests"
                  type="text"
                  value={filterByTextForDisplay}
                />
                <Icon className={styles.searchIcon} type="search" />
              </div>
            </div>

            <div className="grow" data-filtered-by-text={filterByText} data-test-id="TestList">
              <Suspense fallback={<LibrarySpinner />}>
                <TestList />
              </Suspense>
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="h-full w-2" />
        <Panel minSizePercentage={20} order={2}>
          <div className="h-full w-full overflow-hidden rounded-xl">
            <Suspense fallback={<LibrarySpinner />}>
              <TestOverviewContent />
            </Suspense>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
