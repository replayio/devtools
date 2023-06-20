import { Suspense, useContext } from "react";

import ErrorBoundary from "replay-next/components/ErrorBoundary";
import Loader from "replay-next/components/Loader";
import { TestSuiteContext } from "ui/components/TestSuite/views/TestSuiteContext";

import GroupTestCasesPanel from "./GroupedTestCases";
import TestRecordingPanel from "./TestRecording";
import styles from "./TestSuitePanel.module.css";

// TODO Show better/custom error fallback to failed test suites
export default function TestSuitePanel() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className={styles.Loading} data-test-name="TestSuitePanel">
            <Loader />
          </div>
        }
      >
        <TestSuiteSuspends />
      </Suspense>
    </ErrorBoundary>
  );
}

function TestSuiteSuspends() {
  const { testRecording } = useContext(TestSuiteContext);

  return (
    <div className={styles.Panel} data-test-name="TestSuitePanel">
      {testRecording === null ? <GroupTestCasesPanel /> : <TestRecordingPanel />}
    </div>
  );
}
