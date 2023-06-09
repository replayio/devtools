import { Recording } from "shared/graphql/types";
import { isGroupedTestCasesV1 } from "shared/test-suites/RecordingTestMetadata";

export function getDuration(recordings: Recording[]) {
  return recordings.reduce<number>((accumulated, recording) => {
    const testMetadata = recording.metadata?.test;
    if (testMetadata == null || isGroupedTestCasesV1(testMetadata)) {
      return accumulated;
    }

    return accumulated + testMetadata.approximateDuration;
  }, 0);
}
