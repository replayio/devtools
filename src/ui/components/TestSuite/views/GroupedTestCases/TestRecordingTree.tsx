import { useContext } from "react";

import TestRecordingTreeRow from "ui/components/TestSuite/views/GroupedTestCases/TestRecordingTreeRow";
import { TestTree } from "ui/components/TestSuite/views/GroupedTestCases/types";
import { TestSuiteContext } from "ui/components/TestSuite/views/TestSuiteContext";

import styles from "./TestRecordingTree.module.css";

export function TestRecordingTree({
  isNested = false,
  scope = null,
  testTree,
}: {
  isNested?: boolean;
  scope?: string | null;
  testTree: TestTree;
}) {
  const { setTestRecording } = useContext(TestSuiteContext);

  const parentScope = scope;
  return (
    <div
      className={styles.Tree}
      data-nested={isNested || undefined}
      data-test-name="TestRecordingTree"
    >
      {scope !== null && <div className={styles.Scope}>{scope}</div>}
      {Object.keys(testTree.scopes).map(scope => (
        <TestRecordingTree
          key={scope}
          isNested={isNested || !!parentScope}
          scope={scope}
          testTree={testTree.scopes[scope]}
        />
      ))}
      {testTree.testRecordings.length > 0 && (
        <ol className={styles.List}>
          {testTree.testRecordings.map((testRecording, index) => (
            <TestRecordingTreeRow
              key={index}
              onClick={() => setTestRecording(testRecording)}
              testRecording={testRecording}
            />
          ))}
        </ol>
      )}
    </div>
  );
}
