import { Suspense, useContext } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";

import { TestRunOverviewPage } from "./Overview/TestRunOverviewContextRoot";
import { TestRunList } from "./TestRunList";
import { TestRunsContext, TestRunsContextRoot } from "./TestRunsContextRoot";

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
            <div className="flex flex-row items-center justify-between gap-4 border-b border-themeBorder bg-bodyBgcolor p-2">
              <div
                className="flex cursor-pointer flex-row items-center gap-2 rounded-md border-inputBorder bg-themeTextFieldBgcolor px-2.5 py-1.5 text-sm text-themeTextFieldColor focus:outline-none focus:ring focus:ring-primaryAccent"
                data-test-id="TestRunsPage-DropdownTrigger"
                onClick={onClick}
                onKeyDown={onKeyDown}
                tabIndex={0}
              >
                {filterByStatus === "all" ? "Show all runs" : "Show only failures"}
                <Icon className="h-5 w-5" type="chevron-down" />
              </div>
              {contextMenu}
              <div className="relative max-w-sm grow">
                <input
                  className="w-full appearance-none rounded border-none bg-black bg-opacity-10 text-xs focus:outline-none focus:ring focus:ring-primaryAccent"
                  data-test-id="TestRunsPage-FilterInput"
                  onChange={event => setFilterByText(event.currentTarget.value)}
                  placeholder="Filter test runs"
                  type="text"
                  value={filterByTextForDisplay}
                />

                <Icon
                  className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
                  type="search"
                />
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
