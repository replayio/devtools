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
    filterByStatus,
    filterByText,
    filterByTextForDisplay,
    setFilterByStatus,
    setFilterByText,
    testRunId,
  } = useContext(TestRunsContext);

  const {
    contextMenu,
    onContextMenu: onClick,
    onKeyDown,
  } = useContextMenu(
    <>
      <ContextMenuItem dataTestId="show-all-runs" onSelect={() => setFilterByStatus("all")}>
        Show all runs
      </ContextMenuItem>
      <ContextMenuItem dataTestId="show-only-failures" onSelect={() => setFilterByStatus("failed")}>
        Show only failures
      </ContextMenuItem>
    </>,
    { alignTo: "auto-target" }
  );

  return (
    <div className="flex flex-grow flex-row p-2">
      <PanelGroup autoSaveId="Library:TestRuns" direction="horizontal">
        <Panel minSize={20} order={1}>
          <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-bodyBgcolor">
            <div className="flex flex-row items-center justify-between gap-2 border-b border-themeBorder bg-bodyBgcolor p-2">
              <div
                className={styles.dropdownTrigger}
                data-test-id="TestRunsPage-DropdownTrigger"
                onClick={onClick}
                onKeyDown={onKeyDown}
                tabIndex={0}
              >
                {filterByStatus === "all" ? "Show all runs" : "Show only failures"}
                <Icon className="h-5 w-5" type="chevron-down" />
              </div>
              {contextMenu}
              <div className={styles.filterContainer}>
                <input
                  className={styles.filterInput}
                  data-test-id="TestRunsPage-FilterInput"
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
      </PanelGroup>
    </div>
  );
}
