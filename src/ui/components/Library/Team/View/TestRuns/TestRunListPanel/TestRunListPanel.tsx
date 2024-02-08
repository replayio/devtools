import { useContext } from "react";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { IndeterminateProgressBar } from "replay-next/components/IndeterminateLoader";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";

import { TeamContext } from "../../../TeamContextRoot";
import { TimeFilterContext, withinTeamRetentionLimit } from "../../TimeFilterContextRoot";
import { FilterField } from "../FilterField";
import { TestRunsContext } from "../TestRunsContextRoot";
import { TestRunList } from "./TestRunList";
import { TestRunsStats } from "./TestRunsStats";
import dropdownStyles from "../Dropdown.module.css";

export default function TestRunListPanel() {
  const {
    filterByBranch,
    filterByStatus,
    filterByText,
    filterByTextForDisplay,
    setFilterByBranch,
    setFilterByStatus,
    setFilterByText,
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

  return (
    <div className="relative flex h-full w-full flex-col gap-4 overflow-hidden rounded-xl bg-bodyBgcolor p-2">
      <div className="flex flex-col gap-2">
        <div className="grid w-full grid-cols-3 gap-2 bg-bodyBgcolor">
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
              {filterByTime === "week" ? "Last 7 days" : "Last 30 days"}
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
          dataTestId="TestRunsPage-FilterByText-Input"
          onChange={setFilterByText}
          value={filterByTextForDisplay}
        />
      </div>
      <TestRunsStats />
      <div
        className="grow"
        data-filtered-by-branch={filterByBranch}
        data-filtered-by-status={filterByStatus}
        data-filtered-by-text={filterByText}
        data-test-id="TestRunList"
      >
        <TestRunList />
      </div>
    </div>
  );
}
