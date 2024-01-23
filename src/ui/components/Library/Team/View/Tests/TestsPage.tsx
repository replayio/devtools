import { Suspense, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import { trackEvent } from "ui/utils/telemetry";

import { TestSuitePanelMessage } from "../TestSuitePanelMessage";
import { TimeFilterContextRoot, TimeFilterOptions } from "../TimeFilterContextRoot";
import { TestsContextRoot } from "./TestContextRoot";
import { TestDetailsPanel } from "./TestDetailsPanel/TestDetailsPanel";
import { TestListPanel } from "./TestListPanel/TestListPanel";

function ErrorFallback() {
  return (
    <TestSuitePanelMessage>Failed to load tests. Refresh page to try again.</TestSuitePanelMessage>
  );
}

export function TestsPage() {
  useEffect(() => {
    trackEvent("test_dashboard.open", { view: "tests" });
  }, []);

  return (
    <InlineErrorBoundary name="TestsPageErrorBoundary" fallback={<ErrorFallback />}>
      <TimeFilterContextRoot>
        <TestsContextRoot>
          <div className="flex w-full flex-grow flex-row p-1">
            <PanelGroup autoSaveId="Library:Tests" direction="horizontal">
              <Panel minSize={20} order={1}>
                <TestListPanel />
              </Panel>
              <PanelResizeHandle className="h-full w-1" />
              <Panel minSize={20} order={2}>
                <div className="h-full w-full overflow-hidden rounded-xl">
                  <Suspense fallback={<LibrarySpinner />}>
                    <TestDetailsPanel />
                  </Suspense>
                </div>
              </Panel>
            </PanelGroup>
          </div>
        </TestsContextRoot>
      </TimeFilterContextRoot>
    </InlineErrorBoundary>
  );
}
