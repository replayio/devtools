import orderBy from "lodash/orderBy";

import { Recording } from "shared/graphql/types";

export type RecordingGroup = {
  count: number;
  fileNameToRecordings: { [fileName: string]: Recording[] };
};

function testPassed(recording: Recording) {
  return recording.metadata?.test?.result === "passed";
}

function testFailed(recording: Recording) {
  return (
    recording.metadata?.test?.result &&
    ["failed", "timedOut"].includes(recording.metadata?.test?.result)
  );
}

export function groupRecordings(recordings: Recording[]) {
  console.log("groupRecordings:", recordings.length);
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
    const file = recording.metadata?.test?.file;
    if (!file) {
      return acc;
    }
    if (!acc[file]) {
      acc[file] = [];
    }
    acc[file].push(recording);
    return acc;
  }, {} as Record<string, Recording[]>);

  for (const file in recordingsMap) {
    const recordings = recordingsMap[file];

    const didAnyTestPass = recordings.some(testPassed);

    for (const recording of recordings) {
      if (testPassed(recording)) {
        if (passedRecordings.fileNameToRecordings[file]) {
          passedRecordings.fileNameToRecordings[file].push(recording);
        } else {
          passedRecordings.count++;
          passedRecordings.fileNameToRecordings[file] = [recording];
        }
      } else if (testFailed(recording)) {
        if (didAnyTestPass) {
          if (flakyRecordings.fileNameToRecordings[file]) {
            flakyRecordings.fileNameToRecordings[file].push(recording);
          } else {
            flakyRecordings.count++;
            flakyRecordings.fileNameToRecordings[file] = [recording];
          }
        } else {
          if (failedRecordings.fileNameToRecordings[file]) {
            failedRecordings.fileNameToRecordings[file].push(recording);
          } else {
            failedRecordings.count++;
            failedRecordings.fileNameToRecordings[file] = [recording];
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
