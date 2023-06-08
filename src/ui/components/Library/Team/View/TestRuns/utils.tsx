import { Recording } from "shared/graphql/types";
import { isLegacyGroupedTestCases } from "shared/test-suites/types";

export function getDuration(recordings: Recording[]) {
  return recordings.reduce<number>((accumulated, recording) => {
    const testMetadata = recording.metadata?.test;
    if (testMetadata == null || isLegacyGroupedTestCases(testMetadata)) {
      return accumulated;
    }

    return accumulated + testMetadata.approximateDuration;
  }, 0);
}
