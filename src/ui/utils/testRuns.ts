import orderBy from "lodash/orderBy";

import { Recording } from "shared/graphql/types";
import {
  getGroupedTestCasesFilePath,
  isGroupedTestCasesV1,
} from "shared/test-suites/RecordingTestMetadata";

export type RecordingGroup = {
  count: number;
  fileNameToRecordings: { [fileName: string]: Recording[] };
};

export type RecordingGroups = {
  passedRecordings: RecordingGroup;
  failedRecordings: RecordingGroup;
  flakyRecordings: RecordingGroup;
};

function testPassed(recording: Recording) {
  const testMetadata = recording.metadata?.test;
  if (testMetadata == null) {
    return false;
  } else if (isGroupedTestCasesV1(testMetadata)) {
    return testMetadata.result === "passed";
  } else {
    const { passed = 0 } = testMetadata.resultCounts;
    return !testFailed(recording) && passed > 0;
  }
}

function testFailed(recording: Recording) {
  const testMetadata = recording.metadata?.test;
  if (testMetadata == null) {
    return false;
  } else if (isGroupedTestCasesV1(testMetadata)) {
    return testMetadata.result === "failed" || testMetadata.result === "timedOut";
  } else {
    const { failed = 0, timedOut = 0 } = testMetadata.resultCounts ?? {};
    return failed > 0 || timedOut > 0;
  }
}

export function groupRecordings(recordings: Recording[]): RecordingGroups {
  const passedRecordings: RecordingGroup = {
    count: 0,
    fileNameToRecordings: {},
  };
  const failedRecordings: RecordingGroup = {
    count: 0,
    fileNameToRecordings: {},
  };
  const flakyRecordings: RecordingGroup = {
    count: 0,
    fileNameToRecordings: {},
  };

  const sortedRecordings = orderBy(recordings, "date", "desc");

  const recordingsMap = sortedRecordings.reduce((accumulated, recording) => {
    const testMetadata = recording.metadata?.test;
    if (testMetadata == null) {
      return accumulated;
    }

    const filePath = getGroupedTestCasesFilePath(testMetadata);
    if (!filePath) {
      return accumulated;
    }
    if (!accumulated[filePath]) {
      accumulated[filePath] = [];
    }
    accumulated[filePath].push(recording);
    return accumulated;
  }, {} as Record<string, Recording[]>);

  for (const filePath in recordingsMap) {
    const recordings = recordingsMap[filePath];

    const didAnyTestPass = recordings.some(testPassed);

    for (const recording of recordings) {
      if (testPassed(recording)) {
        if (passedRecordings.fileNameToRecordings[filePath]) {
          passedRecordings.fileNameToRecordings[filePath].push(recording);
        } else {
          passedRecordings.count++;
          passedRecordings.fileNameToRecordings[filePath] = [recording];
        }
      } else if (testFailed(recording)) {
        if (didAnyTestPass) {
          if (flakyRecordings.fileNameToRecordings[filePath]) {
            flakyRecordings.fileNameToRecordings[filePath].push(recording);
          } else {
            flakyRecordings.count++;
            flakyRecordings.fileNameToRecordings[filePath] = [recording];
          }
        } else {
          if (failedRecordings.fileNameToRecordings[filePath]) {
            failedRecordings.fileNameToRecordings[filePath].push(recording);
          } else {
            failedRecordings.count++;
            failedRecordings.fileNameToRecordings[filePath] = [recording];
          }
        }
      }
    }
  }

  return {
    passedRecordings,
    failedRecordings,
    flakyRecordings,
  };
}
