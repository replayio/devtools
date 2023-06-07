import { Recording } from "shared/graphql/types";
import { isLegacyTestMetadata } from "shared/test-suites/types";

export function getDuration(recordings: Recording[]) {
  return recordings.reduce<number>((accumulated, recording) => {
    const testMetadata = recording.metadata?.test;
    if (testMetadata == null || isLegacyTestMetadata(testMetadata)) {
      return accumulated;
    }

    return accumulated + testMetadata.approximateDuration;
  }, 0);
}
