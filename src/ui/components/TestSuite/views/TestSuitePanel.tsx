import { useContext } from "react";

import Loader from "replay-next/components/Loader";
import { TestSuiteContext } from "ui/components/TestSuite/views/TestSuiteContext";

import GroupTestCasesPanel from "./GroupedTestCases";
import TestRecordingPanel from "./TestRecording";
import styles from "./TestSuitePanel.module.css";

export default function TestSuitePanel() {
  const { groupedTestCases, testRecording } = useContext(TestSuiteContext);
  if (groupedTestCases == null) {
    return (
      <div className={styles.Loading}>
        <Loader />
      </div>
    );
  }

  return (
    <div className={styles.Panel}>
      {testRecording === null ? <GroupTestCasesPanel /> : <TestRecordingPanel />}
    </div>
  );
}
