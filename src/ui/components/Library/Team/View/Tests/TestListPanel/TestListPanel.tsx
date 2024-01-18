import { useContext } from "react";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import LibraryDropdownTrigger from "ui/components/Library/LibraryDropdownTrigger";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";

import { TeamContext } from "../../../TeamContextRoot";
import { FilterField } from "../../TestRuns/FilterField";
import {
  TimeFilterContext,
  TimeFilterOptions,
  withinTeamRetentionLimit,
} from "../../TimeFilterContextRoot";
import { TestContext } from "../TestContextRoot";
import { TestList } from "./TestList";

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

export function TestListPanel() {
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
      <ContextMenuItem dataTestId="failureRate" onSelect={() => setSortBy("failureRate")}>
        {sortLabel.failureRate}
      </ContextMenuItem>
      <ContextMenuItem dataTestId="flakyRate" onSelect={() => setSortBy("flakyRate")}>
        {sortLabel.flakyRate}
      </ContextMenuItem>
      <ContextMenuItem dataTestId="alphabetical" onSelect={() => setSortBy("alphabetical")}>
        {sortLabel.alphabetical}
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
          <ContextMenuItem onSelect={() => setFilterByTime("hour")}>
            {timeFilterLabel.hour}
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => setFilterByTime("day")}>
            {timeFilterLabel.day}
          </ContextMenuItem>
        </>
      )}
      {withinTeamRetentionLimit(team, 7) && (
        <ContextMenuItem onSelect={() => setFilterByTime("week")}>
          {timeFilterLabel.week}
        </ContextMenuItem>
      )}
      {withinTeamRetentionLimit(team, 30) && (
        <ContextMenuItem onSelect={() => setFilterByTime("month")}>
          {timeFilterLabel.month}
        </ContextMenuItem>
      )}
    </>,
    { alignTo: "auto-target" }
  );

  return (
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
        <FilterField
          className="flex-grow"
          dataTestId="TestPage-FilterByText-Input"
          onChange={setFilterByText}
          placeholder="Filter tests"
          value={filterByTextForDisplay}
        />
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
  );
}
