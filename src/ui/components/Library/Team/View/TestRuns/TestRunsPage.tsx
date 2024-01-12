import { Suspense, useContext, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import Icon from "replay-next/components/Icon";
import { IndeterminateProgressBar } from "replay-next/components/IndeterminateLoader";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import { trackEvent } from "ui/utils/telemetry";

import { TeamContext } from "../../TeamContextRoot";
import { TestSuitePanelMessage } from "../TestSuitePanelMessage";
import {
  TimeFilterContext,
  TimeFilterContextRoot,
  withinTeamRetentionLimit,
} from "../TimeFilterContextRoot";
import { Dropdown } from "./Dropdown";
import { FilterField } from "./FilterField";
import { TestRunOverviewPanel } from "./Overview/TestRunOverviewPanel";
import { TestRunList } from "./TestRunList";
import { TestRunsContext, TestRunsContextRoot } from "./TestRunsContextRoot";
import { TestRunSpecDetails } from "./TestRunSpecDetails";
import { TestRunsStats } from "./TestRunsStats";
import styles from "./TestRunsPage.module.css";

function ErrorFallback() {
  return (
    <TestSuitePanelMessage>
      Failed to load test runs. Refresh page to try again.
    </TestSuitePanelMessage>
  );
}

export function TestRunsPage() {
  return (
    <InlineErrorBoundary name="TestRunsPageErrorBoundary" fallback={<ErrorFallback />}>
      <TimeFilterContextRoot>
        <TestRunsContextRoot>
          <TestRunsContent />
        </TestRunsContextRoot>
      </TimeFilterContextRoot>
    </InlineErrorBoundary>
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
    testRuns,
  } = useContext(TestRunsContext);
  const { team } = useContext(TeamContext);
  const { filterByTime, setFilterByTime } = useContext(TimeFilterContext);

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
      {withinTeamRetentionLimit(team, 7) && (
        <ContextMenuItem dataTestId="week" onSelect={() => setFilterByTime("week")}>
          Last 7 days
        </ContextMenuItem>
      )}
      {withinTeamRetentionLimit(team, 30) && (
        <ContextMenuItem dataTestId="month" onSelect={() => setFilterByTime("month")}>
          Last 30 days
        </ContextMenuItem>
      )}
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

  useEffect(() => {
    trackEvent("test_dashboard.open", { view: "runs" });
  }, []);

  return (
    <div className="flex w-full flex-grow flex-row p-1">
      <PanelGroup autoSaveId="Library:TestRuns" direction="horizontal">
        <Panel minSize={20} order={1}>
          <div className="relative flex h-full w-full flex-col gap-4 overflow-hidden rounded-xl bg-bodyBgcolor p-2">
            {testRunsLoading && testRuns.length > 0 && <IndeterminateProgressBar />}
            <div className="flex flex-col gap-2">
              <div className="grid w-full grid-cols-3 gap-2 bg-bodyBgcolor">
                <Dropdown
                  data-test-id="TestRunsPage-ResultFilter-DropdownTrigger"
                  onClick={onClickStatusFilter}
                  onKeyDown={onKeyDownStatusFilter}
                  label={filterByStatus === "all" ? "All runs" : "Only failures"}
                >
                  {contextMenuStatusFilter}
                </Dropdown>
                <Dropdown
                  data-test-id="TestRunsPage-TimeFilter-DropdownTrigger"
                  onClick={onClickTimeFilter}
                  onKeyDown={onKeyDownTimeFilter}
                  label={filterByTime === "week" ? "Last 7 days" : "Last 30 days"}
                >
                  {contextMenuTimeFilter}
                </Dropdown>
                <Dropdown
                  data-test-id="TestRunsPage-BranchFilter-DropdownTrigger"
                  onClick={onClickBranchFilter}
                  onKeyDown={onKeyDownBranchFilter}
                  label={filterByBranch === "all" ? "All branches" : "Only primary branch"}
                >
                  {contextMenuBranchFilter}
                </Dropdown>
              </div>
              <FilterField
                placeholder="Filter"
                dataTestId="TestRunsPage-FilterByText-Input"
                onChange={setFilterByText}
                value={filterByTextForDisplay}
              />
            </div>
            {testRunsLoading && testRuns.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <LibrarySpinner />
              </div>
            ) : (
              <TestRunsStats />
            )}
            <div
              className="grow"
              data-filtered-by-status={filterByStatus}
              data-filtered-by-text={filterByText}
              data-test-id="TestRunList"
            >
              {testRunsLoading && testRuns.length === 0 ? (
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
              <TestRunOverviewPanel />
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
