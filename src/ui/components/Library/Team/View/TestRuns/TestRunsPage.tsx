import { useContext, useDeferredValue, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { Dropdown, DropdownItem } from "ui/components/Library/LibraryDropdown";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import PortalDropdown from "ui/components/shared/PortalDropdown";

import { TestRunOverviewPage } from "./Overview/TestRunOverviewContextRoot";
import { TestRunList } from "./TestRunList";
import { TestRunsContainer, TestRunsContext } from "./TestRunsContextRoot";

export function TestRunsPage() {
  return (
    <TestRunsContainer>
      <TestRunsContent />
    </TestRunsContainer>
  );
}

function TestRunsContent() {
  const { focusId } = useContext(TestRunsContext);

  // TODO
  const [mode, setMode] = useState<"all" | "failed">("all");

  // TODO
  const [filterByText, setFilterByText] = useState("");
  const filterByTextDeferred = useDeferredValue(filterByText);

  const {
    contextMenu,
    onContextMenu: onClick,
    onKeyDown,
  } = useContextMenu(
    <>
      <ContextMenuItem onSelect={() => setMode("all")}>Show all runs</ContextMenuItem>
      <ContextMenuItem onSelect={() => setMode("failed")}>Show only failures</ContextMenuItem>
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
                onClick={onClick}
                onKeyDown={onKeyDown}
                tabIndex={0}
              >
                {mode === "all" ? "Show all runs" : "Show only failures"}
                <Icon className="h-5 w-5" type="chevron-down" />
              </div>
              {contextMenu}
              <div className="relative max-w-sm grow">
                <input
                  className="w-full appearance-none rounded border-none bg-black bg-opacity-10 text-xs focus:outline-none focus:ring focus:ring-primaryAccent"
                  onChange={event => setFilterByText(event.currentTarget.value)}
                  placeholder="Filter test runs"
                  type="text"
                  value={filterByText}
                />

                <Icon
                  className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
                  type="search"
                />
              </div>
            </div>
            <div className="grow">
              <TestRunList filterByText={filterByTextDeferred} mode={mode} />
            </div>
          </div>
        </Panel>

        {focusId && (
          <>
            <PanelResizeHandle className="h-full w-2" />
            <Panel minSize={20} order={2}>
              <div className="h-full w-full overflow-hidden rounded-xl">
                <TestRunOverviewPage />
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}
