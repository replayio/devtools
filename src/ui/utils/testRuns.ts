import orderBy from "lodash/orderBy";

import { Recording } from "shared/graphql/types";

function testPassed(recording: Recording) {
  return recording.metadata?.test?.result === "passed";
}

function testFailed(recording: Recording) {
  return (
    recording.metadata?.test?.result &&
    ["failed", "timedOut"].includes(recording.metadata?.test?.result)
  );
}

export function groupRecordings(recordings: Recording[] | undefined) {
  const passedRecordings: Recording[] = [];
  const failedRecordings: Recording[] = [];
  const flakyRecordings: Recording[] = [];
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
    if (recordings.length > 1) {
      for (const recording of recordings) {
        if (testPassed(recording)) {
          passedRecordings.push(recording);
        } else if (testFailed(recording)) {
          flakyRecordings.push(recording);
        }
      }
    } else {
      const recording = recordings[0];
      if (testPassed(recording)) {
        passedRecordings.push(recording);
      } else if (testFailed(recording)) {
        failedRecordings.push(recording);
      }
    }
  }

  return {
    passedRecordings,
    failedRecordings,
    flakyRecordings,
  };
}
