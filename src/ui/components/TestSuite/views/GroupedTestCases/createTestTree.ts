import { TestRecording } from "shared/test-suites/types";
import { TestTree } from "ui/components/TestSuite/views/GroupedTestCases/types";

export function createTestTree(testRecordings: TestRecording[]): TestTree {
  const testTree: TestTree = {
    scopes: {},
    testRecordings: [],
  };

  testRecordings.forEach(testRecording => {
    let targetTestTree = testTree;

    if (testRecording.source.scope) {
      testRecording.source.scope.forEach(name => {
        if (!targetTestTree.scopes[name]) {
          targetTestTree.scopes[name] = {
            scopes: {},
            testRecordings: [],
          };
        }

        targetTestTree = targetTestTree.scopes[name];
      });
    }

    targetTestTree.testRecordings.push(testRecording);
  });

  return testTree;
}
