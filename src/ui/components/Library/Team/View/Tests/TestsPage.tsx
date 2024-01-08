import { Suspense, useContext, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import ErrorBoundary from "replay-next/components/ErrorBoundary";
import Icon from "replay-next/components/Icon";
import LibraryDropdownTrigger from "ui/components/Library/LibraryDropdownTrigger";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import { trackEvent } from "ui/utils/telemetry";

import { TeamContext } from "../../TeamContextRoot";
import { TestSuitePanelMessage } from "../TestSuitePanelMessage";
import {
  TimeFilterContext,
  TimeFilterContextRoot,
  TimeFilterOptions,
  withinTeamRetentionLimit,
} from "../TimeFilterContextRoot";
import { TestOverviewContent } from "./Overview/TestOverviewContent";
import { TestContext, TestsContextRoot } from "./TestContextRoot";
import { TestList } from "./TestList";
import styles from "./TestsPage.module.css";

export function TestsPage() {
  return (
    <ErrorBoundary name="TestsPageErrorBoundary" fallback={<ErrorFallback />}>
      <TimeFilterContextRoot>
        <TestsContextRoot>
          <TestsContent />
        </TestsContextRoot>
      </TimeFilterContextRoot>
    </ErrorBoundary>
  );
}

function ErrorFallback() {
  return (
    <TestSuitePanelMessage>Failed to load tests. Refresh page to try again.</TestSuitePanelMessage>
  );
}

const timeFilterLabel: Record<TimeFilterOptions, string> = {
  "two-week": "Last two weeks",
  week: "Last 7 days",
  day: "Last day",
  hour: "Last hour",
  month: "Last 30 days",
};
const sortLabel = {
  failureRate: "Sort by failure rate",
  flakyRate: "Sort by flaky rate",
  alphabetical: "Sort alphabetically",
};

function TestsContent() {
  const { team } = useContext(TeamContext);
  const { filterByText, setFilterByText, filterByTextForDisplay, sortBy, setSortBy, testsLoading } =
    useContext(TestContext);
  const { filterByTime, setFilterByTime } = useContext(TimeFilterContext);

  const {
    contextMenu: contextMenuSortBy,
    onContextMenu: onClickSortBy,
    onKeyDown: onKeyDownSortBy,
  } = useContextMenu(
    <>
      <ContextMenuItem onSelect={() => setSortBy("failureRate")}>
        Sort by failure rate
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => setSortBy("flakyRate")}>Sort by flaky rate</ContextMenuItem>
      <ContextMenuItem onSelect={() => setSortBy("alphabetical")}>
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
      {withinTeamRetentionLimit(team, 1) && (
        <>
          <ContextMenuItem onSelect={() => setFilterByTime("hour")}>Last hour</ContextMenuItem>
          <ContextMenuItem onSelect={() => setFilterByTime("day")}>Last day</ContextMenuItem>
        </>
      )}
      {withinTeamRetentionLimit(team, 7) && (
        <ContextMenuItem onSelect={() => setFilterByTime("week")}>Last 7 days</ContextMenuItem>
      )}
      {withinTeamRetentionLimit(team, 30) && (
        <ContextMenuItem onSelect={() => setFilterByTime("month")}>Last 30 days</ContextMenuItem>
      )}
    </>,
    { alignTo: "auto-target" }
  );

  useEffect(() => {
    trackEvent("test_dashboard.open", { view: "tests" });
  }, []);

  return (
    <div className="flex w-full flex-grow flex-row p-1">
      <PanelGroup autoSaveId="Library:Tests" direction="horizontal">
        <Panel minSize={20} order={1}>
          <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-bodyBgcolor">
            <div className="flex flex-row items-center justify-between gap-2 border-b border-themeBorder bg-bodyBgcolor p-2">
              <LibraryDropdownTrigger
                testId="TestPage-ResultFilter-DropdownTrigger"
                onKeyDown={onKeyDownSortBy}
                onClick={onClickSortBy}
                label={sortLabel[sortBy]}
              />
              {contextMenuSortBy}
              <LibraryDropdownTrigger
                testId="TestPage-BranchFilter-DropdownTrigger"
                onClick={onClickTimeFilter}
                onKeyDown={onKeyDownTimeFilter}
                label={timeFilterLabel[filterByTime]}
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
              {testsLoading ? (
                <div className="flex h-full items-center justify-center">
                  <LibrarySpinner />
                </div>
              ) : (
                <TestList />
              )}
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="h-full w-1" />
        <Panel minSize={20} order={2}>
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
