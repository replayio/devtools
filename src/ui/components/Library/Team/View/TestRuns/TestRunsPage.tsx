import { useContext } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

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

  return (
    <div className="flex flex-grow flex-row p-4">
      <PanelGroup autoSaveId="Library:TestRuns" direction="horizontal">
        <Panel minSize={20} order={1}>
          <div className="h-full w-full overflow-hidden rounded-xl">
            <TestRunList />
          </div>
        </Panel>

        {focusId && (
          <>
            <PanelResizeHandle className="h-full w-4" />
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
