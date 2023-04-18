import { Suspense, useMemo } from "react";

import Loader from "replay-next/components/Loader";
import { TestItemsCache } from "ui/components/TestSuite/suspense/TestItemsCache";
import { ProcessedTestItem } from "ui/components/TestSuite/types";
import { useGetRecordingId } from "ui/hooks/recordings";
import { getEvents, getRequests } from "ui/reducers/network";
import { useAppSelector } from "ui/setup/hooks";

import TestTreeRow from "./TestItemTreeRow";
import styles from "./TestItemTree.module.css";

type TestTree = {
  // The "scope" refers to the title of a describe() block.
  // A test file may not contain any of these,
  // or it may contain many of (and they can be nested).
  scopes: { [branchName: string]: TestTree };

  // Test items correspond to an it() blocks.
  // These may belong to a branch (aka a describe() block)
  // or they may be at the root of a test (within the module).
  testItems: ProcessedTestItem[];
};

export default function TestItemTree({
  selectTestItem,
}: {
  selectTestItem: (testItem: ProcessedTestItem) => void;
}) {
  return (
    <Suspense fallback={<Loader />}>
      <TestItemTreeSuspends selectTestItem={selectTestItem} />
    </Suspense>
  );
}

function TestItemTreeSuspends({
  selectTestItem,
}: {
  selectTestItem: (testItem: ProcessedTestItem) => void;
}) {
  const recordingId = useGetRecordingId();
  const requestInfo = useAppSelector(getRequests);
  const requestEventInfo = useAppSelector(getEvents);

  const testItems = TestItemsCache.read(recordingId, requestInfo, requestEventInfo);

  return <TestTree selectTestItem={selectTestItem} testItems={testItems} />;
}

function TestTree({
  selectTestItem,
  testItems,
}: {
  selectTestItem: (testItem: ProcessedTestItem) => void;
  testItems: ProcessedTestItem[];
}) {
  const testTree = useMemo(() => createTestTree(testItems), [testItems]);

  return <TreeRenderer selectTestItem={selectTestItem} testTree={testTree} />;
}

function TreeRenderer({
  isNested = false,
  scope = null,
  selectTestItem,
  testTree,
}: {
  isNested?: boolean;
  scope?: string | null;
  selectTestItem: (testItem: ProcessedTestItem) => void;
  testTree: TestTree;
}) {
  const parentScope = scope;
  return (
    <div className={styles.Tree} data-nested={isNested || undefined}>
      {scope !== null && <div className={styles.Scope}>{scope}</div>}
      {Object.keys(testTree.scopes).map(scope => (
        <TreeRenderer
          key={scope}
          isNested={isNested || !!parentScope}
          scope={scope}
          selectTestItem={selectTestItem}
          testTree={testTree.scopes[scope]}
        />
      ))}
      {testTree.testItems.length > 0 && (
        <ol className={styles.List}>
          {testTree.testItems.map((testItem, index) => (
            <TestTreeRow key={index} onClick={() => selectTestItem(testItem)} testItem={testItem} />
          ))}
        </ol>
      )}
    </div>
  );
}

function createTestTree(testItems: ProcessedTestItem[]): TestTree {
  const testTree: TestTree = {
    scopes: {},
    testItems: [],
  };

  testItems.forEach(testItem => {
    let targetTestTree = testTree;

    if (testItem.scopePath) {
      testItem.scopePath.forEach(scope => {
        if (!targetTestTree.scopes[scope]) {
          targetTestTree.scopes[scope] = {
            scopes: {},
            testItems: [],
          };
        }

        targetTestTree = targetTestTree.scopes[scope];
      });
    }

    targetTestTree.testItems.push(testItem);
  });

  return testTree;
}
