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
    <div className="flex flex-row flex-grow p-2">
      <PanelGroup autoSaveId="Library:TestRuns" direction="horizontal">
        <Panel minSize={20} order={1}>
          <div className="flex flex-col w-full h-full overflow-hidden rounded-xl bg-bodyBgcolor">
            <div className="flex flex-row items-center justify-between gap-4 p-2 border-b border-themeBorder bg-bodyBgcolor">
              <div
                className="flex cursor-pointer flex-row items-center gap-2 rounded-md border-inputBorder bg-themeTextFieldBgcolor px-2.5 py-1.5 text-sm text-themeTextFieldColor focus:outline-none focus:ring focus:ring-primaryAccent"
                onClick={onClick}
                onKeyDown={onKeyDown}
                tabIndex={0}
              >
                {mode === "all" ? "Show all runs" : "Show only failures"}
                <Icon className="w-5 h-5" type="chevron-down" />
              </div>
              {contextMenu}
              <div className="relative max-w-sm grow">
                <input
                  className="w-full text-xs bg-black border-none rounded appearance-none bg-opacity-10 focus:outline-none focus:ring focus:ring-primaryAccent"
                  onChange={event => setFilterByText(event.currentTarget.value)}
                  placeholder="Filter test runs"
                  type="text"
                  value={filterByText}
                />

                <Icon
                  className="absolute w-4 h-4 -translate-y-1/2 opacity-50 right-4 top-1/2"
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
            <PanelResizeHandle className="w-2 h-full" />
            <Panel minSize={20} order={2}>
              <div className="w-full h-full overflow-hidden rounded-xl">
                <TestRunOverviewPage />
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}
