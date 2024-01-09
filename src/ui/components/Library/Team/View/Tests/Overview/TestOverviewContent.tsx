import { useContext, useEffect, useState } from "react";

import { IndeterminateProgressBar } from "replay-next/components/IndeterminateLoader";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";

import { TestSuitePanelMessage } from "../../TestSuitePanelMessage";
import { useTest } from "../hooks/useTest";
import { TestContext } from "../TestContextRoot";
import { TestDetails } from "./TestDetails";
import styles from "./TestOverviewContent.module.css";

function SelectTestMessage({ error }: { error?: boolean }) {
  return error ? (
    <TestSuitePanelMessage data-test-id="FailedToLoadTestDetails">
      Failed to load test details
    </TestSuitePanelMessage>
  ) : (
    <TestSuitePanelMessage data-test-id="NoTestSelected">
      Select a test to see its details here
    </TestSuitePanelMessage>
  );
}

export function TestOverviewContent() {
  const { testId, tests } = useContext(TestContext);

  let children = null;

  if (testId && tests.some(t => t.testId === testId)) {
    children = <TestOverview testId={testId} />;
  } else {
    children = <SelectTestMessage />;
  }

  return (
    <div className={`flex h-full flex-col text-sm transition ${styles.runOverview} `}>
      {children}
    </div>
  );
}

function TestOverview({ testId }: { testId: string }) {
  const [lastTest, setLastTest] = useState<typeof test | null>(null);
  const { test, loading, error } = useTest(testId);

  useEffect(() => {
    if (test) {
      setLastTest(test);
    }
  }, [test]);

  return (
    <div className={styles.wrapper} data-test-id="TestOverview" data-pending={loading}>
      {loading ? <IndeterminateProgressBar /> : null}
      {lastTest ? (
        <>
          <div data-test-id="TestOverviewTitle" className={styles.testTitle}>
            <div>{lastTest.title}</div>
          </div>
          <div className="flex flex-col overflow-y-auto">
            <TestDetails testRuns={lastTest.testRuns} />
          </div>
        </>
      ) : (
        <SelectTestMessage error={!!error} />
      )}
    </div>
  );
}
