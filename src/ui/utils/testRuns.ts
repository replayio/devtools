import orderBy from "lodash/orderBy";

import { Recording } from "shared/graphql/types";

export type RecordingGroup = {
  count: number;
  fileNameToRecordings: { [fileName: string]: Recording[] };
};

function testPassed(recording: Recording) {
  const { passed = 0 } = recording.metadata?.test?.resultCounts ?? {};
  return !testFailed(recording) && passed > 0;
}

function testFailed(recording: Recording) {
  const { failed = 0, timedOut = 0 } = recording.metadata?.test?.resultCounts ?? {};
  return failed > 0 || timedOut > 0;
}

export function groupRecordings(recordings: Recording[]) {
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

  const recordingsMap = sortedRecordings.reduce((acc, recording) => {
    const filePath = recording.metadata?.test?.source.filePath;
    if (!filePath) {
      return acc;
    }
    if (!acc[filePath]) {
      acc[filePath] = [];
    }
    acc[filePath].push(recording);
    return acc;
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
