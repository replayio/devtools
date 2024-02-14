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

export function testPassed<T extends { result: string }>(test: T) {
  return test.result === "passed" || test.result === "flaky";
}

export function testFailed<T extends { result: string }>(test: T) {
  return test.result === "failed" || test.result === "timedOut";
}

export function groupRecordings(tests: TestRunTestWithRecordings[]): TestGroups {
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

  const recordingsMap = tests.reduce((accumulated, test) => {
    const filePath = test.sourcePath;
    if (!filePath) {
      return accumulated;
    }
    if (!accumulated[filePath]) {
      accumulated[filePath] = [];
    }
    if (!accumulated[filePath].includes(test)) {
      accumulated[filePath].push(test);
    }
    return accumulated;
  }, {} as Record<string, TestRunTestWithRecordings[]>);

  for (const filePath in recordingsMap) {
    const recordingTests = recordingsMap[filePath];

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
        addToTestGroup(passedRecordings, test);
      } else if (test.result === "failed") {
        addToTestGroup(failedRecordings, test);
      } else if (test.result === "flaky") {
        addToTestGroup(flakyRecordings, test);
      }
    }
  }

  return {
    passedRecordings,
    failedRecordings,
    flakyRecordings,
  };
}
