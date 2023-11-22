import { Suspense, useContext } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";

import { FilterField } from "./FilterField";
import { useTestRunDetailsSuspends } from "./hooks/useTestRunDetailsSuspends";
import { TestResultListItem } from "./Overview/TestResultListItem";
import { TestRunOverviewPage } from "./Overview/TestRunOverviewContextRoot";
import { TestRunList } from "./TestRunList";
import { TestRunsContext, TestRunsContextRoot } from "./TestRunsContextRoot";
import _styles from "../../../Library.module.css";
import dropdownStyles from "./Dropdown.module.css";

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
          <div className="flex h-full w-full flex-col gap-4 overflow-hidden rounded-xl bg-bodyBgcolor p-2">
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-center justify-between gap-2 bg-bodyBgcolor">
                <div
                  className={dropdownStyles.dropdownTrigger}
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
                  className={dropdownStyles.dropdownTrigger}
                  data-test-id="TestRunsPage-BranchFilter-DropdownTrigger"
                  onClick={onClickBranchFilter}
                  onKeyDown={onKeyDownBranchFilter}
                  tabIndex={0}
                >
                  {filterByBranch === "all" ? "All branches" : "Only primary branch"}
                  <Icon className="h-5 w-5" type="chevron-down" />
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
          <div
            className={`flex h-full w-full overflow-hidden rounded-xl ${_styles.testReplayDetails}`}
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

function TestRunSpecDetails() {
  const { spec } = useContext(TestRunsContext);
  const { testRunId } = useContext(TestRunsContext);

  const { groupedTests, tests } = useTestRunDetailsSuspends(testRunId);

  const selectedSpecTests = tests?.filter((t: any) => t.sourcePath === spec);

  if (!spec) {
    return (
      <div className="flex h-full w-full items-center justify-center p-2">
        <div className="rounded-md bg-chrome py-2 px-3 text-center">
          Select a test to see its details here
        </div>
      </div>
    );
  } else if (groupedTests === null) {
    return null;
  }

  const selectedTest = selectedSpecTests[0];

  const dates = selectedSpecTests.map(t => t.recordings[0].date);

  console.log({ selectedTest, selectedSpecTests, dates });

  const failedTests = selectedSpecTests.filter(t => t.result === "failed");

  return (
    <div className="flex h-full w-full flex-col justify-start text-sm">
      <div className="overflow-hidden overflow-ellipsis whitespace-nowrap border-b border-themeBorder px-4 py-3 font-bold">
        {spec}
      </div>
      <div className="flex flex-grow flex-col gap-3 overflow-y-auto py-3">
        <div className="flex flex-col gap-2 px-3">
          <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">Replays</div>
          {/* {replays.map((r, i) => (
          <div key="i">{r.title}</div>
        ))} */}
          <div className="">
            {selectedSpecTests.map(s =>
              s.recordings.map(r => (
                <TestResultListItem
                  depth={1}
                  filterByText={""}
                  key={r.id}
                  label={s.result}
                  recording={r}
                  test={s}
                  secondaryBadgeCount={/* index > 0 ? index + 1 : null */ null}
                />
              ))
            )}
          </div>
        </div>
        {failedTests.length ? <Errors failedTests={failedTests} /> : null}
      </div>
    </div>
  );
}

function Errors({ failedTests }: { failedTests: any }) {
  return (
    <div className="flex flex-col gap-2 px-3">
      <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">Errors</div>
      <div className="flex flex-grow flex-col gap-2">
        {failedTests.map((t, i) => (
          // bg-black is wrong for light theme. should use CSS variables?
          <div key={i} className="w-full overflow-x-auto rounded-md bg-black px-3 py-4">
            <div className="whitespace-pre border-l border-l-2 border-red-500 px-3">
              {t.errors.map((e, i) => (
                <>
                  <div className="mb-2 flex flex-row items-center gap-2 text-red-500">
                    <Icon type="warning" className="h-4 w-4" />
                    <span>Error</span>
                  </div>
                  <div key={i} className="font-mono text-xs">
                    {e.split("\n").slice(0, 4).join("\n")}
                  </div>
                </>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
