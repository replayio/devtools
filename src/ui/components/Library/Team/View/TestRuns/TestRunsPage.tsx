import { Suspense, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import { trackEvent } from "ui/utils/telemetry";

import { TestSuitePanelMessage } from "../TestSuitePanelMessage";
import { TimeFilterContextRoot } from "../TimeFilterContextRoot";
import { TestRunDetailsPanel } from "./TestRunDetailsPanel/TestRunDetailsPanel";
import TestRunListPanel from "./TestRunListPanel/TestRunListPanel";
import { TestRunsContextRoot } from "./TestRunsContextRoot";
import { TestRunTestPanel } from "./TestRunTestPanel/TestRunTestPanel";
import styles from "./TestRunsPage.module.css";

function ErrorFallback() {
  return (
    <TestSuitePanelMessage>
      Failed to load test runs. Refresh page to try again.
    </TestSuitePanelMessage>
  );
}

export function TestRunsPage() {
  return (
    <InlineErrorBoundary name="TestRunsPageErrorBoundary" fallback={<ErrorFallback />}>
      <TimeFilterContextRoot>
        <TestRunsContextRoot>
          <TestRunsContent />
        </TestRunsContextRoot>
      </TimeFilterContextRoot>
    </InlineErrorBoundary>
  );
}

function TestRunsContent() {
  useEffect(() => {
    trackEvent("test_dashboard.open", { view: "runs" });
  }, []);

  return (
    <div className="flex w-full flex-grow flex-row p-1">
      <PanelGroup autoSaveId="Library:TestRuns" direction="horizontal">
        <Panel minSize={20} order={1}>
          <TestRunListPanel />
        </Panel>

        <PanelResizeHandle className="h-full w-1" />
        <Panel minSize={20} order={2}>
          <div
            className={`flex h-full w-full items-center justify-center overflow-hidden rounded-xl ${styles.testReplayDetails}`}
          >
            <Suspense fallback={<LibrarySpinner />}>
              <TestRunDetailsPanel />
            </Suspense>
          </div>
        </Panel>
        <PanelResizeHandle className="h-full w-1" />
        <Panel minSize={20} order={2}>
          <div
            className={`flex h-full w-full items-center justify-center overflow-hidden rounded-xl ${styles.testReplayDetails}`}
          >
            <Suspense fallback={<LibrarySpinner />}>
              <TestRunTestPanel />
            </Suspense>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
