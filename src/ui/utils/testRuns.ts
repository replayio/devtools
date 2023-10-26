import orderBy from "lodash/orderBy";

import { Recording } from "shared/graphql/types";
import {
  getGroupedTestCasesFilePath,
  isGroupedTestCasesV1,
} from "shared/test-suites/RecordingTestMetadata";
import { TestRunTest, TestRunTestWithRecordings } from "shared/test-suites/TestRun";

export type TestGroup = {
  count: number;
  fileNameToTests: { [fileName: string]: TestRunTestWithRecordings[] };
};

export type TestGroups = {
  passedRecordings: TestGroup;
  failedRecordings: TestGroup;
  flakyRecordings: TestGroup;
};

export function testPassed(test: TestRunTest) {
  return test.result === "passed";
}

function testFailed(test: TestRunTest) {
  return test.result === "failed" || test.result === "timedOut";
}

export function groupRecordings(recordings: Recording[], tests: TestRunTest[]): TestGroups {
  const passedRecordings: TestGroup = {
    count: 0,
    fileNameToTests: {},
  };
  const failedRecordings: TestGroup = {
    count: 0,
    fileNameToTests: {},
  };
  const flakyRecordings: TestGroup = {
    count: 0,
    fileNameToTests: {},
  };

  const sortedRecordings = orderBy(recordings, "date", "desc");

  const recordingsMap = sortedRecordings.reduce((accumulated, recording) => {
    const test = tests.find(t => t.recordingIds.includes(recording.id));

    if (test == null) {
      return accumulated;
    }

    const testWithRecordings: TestRunTestWithRecordings = { ...test, recordings: [] };

    testWithRecordings.recordings.push(recording);
    const filePath = testWithRecordings.sourcePath;
    if (!filePath) {
      return accumulated;
    }
    if (!accumulated[filePath]) {
      accumulated[filePath] = [];
    }
    if (!accumulated[filePath].includes(testWithRecordings)) {
      accumulated[filePath].push(testWithRecordings);
    }
    return accumulated;
  }, {} as Record<string, TestRunTestWithRecordings[]>);

  for (const filePath in recordingsMap) {
    const recordingTests = recordingsMap[filePath];

    const didAnyTestFail = recordingTests.some(testFailed);
    const didAnyTestPass = recordingTests.some(testPassed);

    function addToTestGroup(group: TestGroup, test: TestRunTestWithRecordings) {
      if (group.fileNameToTests[filePath]) {
        group.fileNameToTests[filePath].push(test);
      } else {
        group.count++;
        group.fileNameToTests[filePath] = [test];
      }
    }

    for (const test of recordingTests) {
      if (test.result === "passed") {
        if (didAnyTestFail) {
          addToTestGroup(flakyRecordings, test);
        } else {
          addToTestGroup(passedRecordings, test);
        }
      } else if (test.result === "failed") {
        if (didAnyTestPass) {
          addToTestGroup(flakyRecordings, test);
        } else {
          addToTestGroup(failedRecordings, test);
        }
      }
    }

    if (didAnyTestFail && didAnyTestPass) {
      flakyRecordings.fileNameToTests[filePath].sort((recordingA, recordingB) => {
        if (testPassed(recordingA) && testFailed(recordingB)) {
          return 1;
        } else if (testFailed(recordingA) && testPassed(recordingB)) {
          return -1;
        } else {
          return 0;
        }
      });
    }
  }

  return {
    passedRecordings,
    failedRecordings,
    flakyRecordings,
  };
}
