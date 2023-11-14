import { Suspense, useContext } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";

import { TestOverviewPage } from "./Overview/TestOverviewContextRoot";
import { TestContext, TestsContextRoot } from "./TestContextRoot";
import { TestList } from "./TestList";
import styles from "./TestsPage.module.css";

export function TestsPage() {
  return (
    <TestsContextRoot>
      {/* <div>Hello</div> */}
      <TestsContent />
    </TestsContextRoot>
  );
}

// function TestRunsContent() {
//   const {
//     filterByBranch,
//     filterByStatus,
//     filterByText,
//     filterByTextForDisplay,
//     setFilterByBranch,
//     setFilterByStatus,
//     setFilterByText,
//   } = useContext(TestsContext);

//   const {
//     contextMenu: contextMenuStatusFilter,
//     onContextMenu: onClickStatusFilter,
//     onKeyDown: onKeyDownStatusFilter,
//   } = useContextMenu(
//     <>
//       <ContextMenuItem dataTestId="show-all-runs" onSelect={() => setFilterByStatus("all")}>
//         All tests
//       </ContextMenuItem>
//       <ContextMenuItem dataTestId="show-only-failures" onSelect={() => setFilterByStatus("failed")}>
//         Only failures
//       </ContextMenuItem>
//     </>,
//     { alignTo: "auto-target" }
//   );

//   const {
//     contextMenu: contextMenuBranchFilter,
//     onContextMenu: onClickBranchFilter,
//     onKeyDown: onKeyDownBranchFilter,
//   } = useContextMenu(
//     <>
//       <ContextMenuItem dataTestId="show-all-branches" onSelect={() => setFilterByBranch("all")}>
//         All branches
//       </ContextMenuItem>
//       <ContextMenuItem
//         dataTestId="show-only-primary-branch"
//         onSelect={() => setFilterByBranch("primary")}
//       >
//         Only primary branch
//       </ContextMenuItem>
//     </>,
//     { alignTo: "auto-target" }
//   );

//   return (
//     <div className="flex w-full flex-grow flex-row p-2">
//       <PanelGroup autoSaveId="Library:TestRuns" direction="horizontal">
//         <Panel minSize={20} order={1}>
//           <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-bodyBgcolor">
//             <div className="flex flex-row items-center justify-between gap-2 border-b border-themeBorder bg-bodyBgcolor p-2">
//               <div
//                 className={styles.dropdownTrigger}
//                 data-test-id="TestPage-ResultFilter-DropdownTrigger"
//                 onClick={onClickStatusFilter}
//                 onKeyDown={onKeyDownStatusFilter}
//                 tabIndex={0}
//               >
//                 {filterByStatus === "all" ? "All runs" : "Only failures"}
//                 <Icon className="h-5 w-5" type="chevron-down" />
//               </div>
//               {contextMenuStatusFilter}
//               <div
//                 className={styles.dropdownTrigger}
//                 data-test-id="TestPage-BranchFilter-DropdownTrigger"
//                 onClick={onClickBranchFilter}
//                 onKeyDown={onKeyDownBranchFilter}
//                 tabIndex={0}
//               >
//                 {filterByBranch === "all" ? "All branches" : "Only primary branch"}
//                 <Icon className="h-5 w-5" type="chevron-down" />
//               </div>
//               {contextMenuBranchFilter}
//               <div className={styles.filterContainer}>
//                 <input
//                   className={styles.filterInput}
//                   data-test-id="TestPage-FilterByText-Input"
//                   onChange={event => setFilterByText(event.currentTarget.value)}
//                   placeholder="Filter test runs"
//                   type="text"
//                   value={filterByTextForDisplay}
//                 />
//                 <Icon className={styles.searchIcon} type="search" />
//               </div>
//             </div>
//             <div
//               className="grow"
//               data-filtered-by-status={filterByStatus}
//               data-filtered-by-text={filterByText}
//               data-test-id="TestList"
//             >
//               <Suspense fallback={<LibrarySpinner />}>
//                 <TestList />
//               </Suspense>
//             </div>
//           </div>
//         </Panel>

//         <PanelResizeHandle className="h-full w-2" />
//         <Panel minSize={20} order={2}>
//           <div className="h-full w-full overflow-hidden rounded-xl">
//             <Suspense fallback={<LibrarySpinner />}>
//               <TestOverviewPage />
//             </Suspense>
//           </div>
//         </Panel>
//       </PanelGroup>
//     </div>
//   );
// }
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
      <ContextMenuItem dataTestId="show-all-runs" onSelect={() => setSortBy("failureRate")}>
        Sort by failure rate
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
      <ContextMenuItem dataTestId="show-all-runs" onSelect={() => setFilterByTime(null)}>
        All tests
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
                data-test-id="TestPage-ResultFilter-DropdownTrigger"
                onKeyDown={onKeyDownSortBy}
                onClick={onClickSortBy}
                tabIndex={0}
              >
                {sortBy === "failureRate" ? "Sort by failure rate" : ""}
                <Icon className="h-5 w-5" type="chevron-down" />
              </div>
              {contextMenuSortBy}
              <div
                className={styles.dropdownTrigger}
                data-test-id="TestPage-BranchFilter-DropdownTrigger"
                onClick={onClickTimeFilter}
                onKeyDown={onKeyDownTimeFilter}
                tabIndex={0}
              >
                {filterByTime === null ? "All tests" : ""}
                <Icon className="h-5 w-5" type="chevron-down" />
              </div>
              {contextMenuTimeFilter}
              <div className={styles.filterContainer}>
                <input
                  className={styles.filterInput}
                  data-test-id="TestPage-FilterByText-Input"
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
              // data-filtered-by-status={filterByStatus}
              data-filtered-by-text={filterByText}
              data-test-id="TestList"
            >
              <Suspense fallback={<LibrarySpinner />}>
                <TestList />
              </Suspense>
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="h-full w-2" />
        <Panel minSize={20} order={2}>
          <div className="h-full w-full overflow-hidden rounded-xl">
            <Suspense fallback={<LibrarySpinner />}>
              <TestOverviewPage />
            </Suspense>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
