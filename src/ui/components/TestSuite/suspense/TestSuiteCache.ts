import assert from "assert";
import { RecordingId } from "@replayio/protocol";

import { createSingleEntryCacheWithTelemetry } from "replay-next/src/utils/suspense";
import { ReplayClientInterface } from "shared/client/types";
import { migrateIncrementalGroupedTestCases } from "shared/test-suites/migrateIncrementalGroupedTestCases";
import { GroupedTestCases, isLegacyTestMetadata } from "shared/test-suites/types";
import { RecordingCache } from "ui/components/TestSuite/suspense/RecordingCache";
import { isTestSuiteReplay } from "ui/components/TestSuite/utils/isTestSuiteReplay";

export const TestSuiteCache = createSingleEntryCacheWithTelemetry<
  [replayClient: ReplayClientInterface, recordingId: RecordingId],
  GroupedTestCases | null
>({
  debugLabel: "TestSuiteCache",
  load: async ([replayClient, recordingId]) => {
    const recording = await RecordingCache.readAsync(recordingId);
    if (!isTestSuiteReplay(recording)) {
      return null;
    }

    const metadata = recording.metadata;
    assert(metadata != null);
    assert(metadata.test != null);

    const testMetadata = metadata.test;
    if (isLegacyTestMetadata(testMetadata)) {
      return null;
    }

    // Migrate intermediate test data to the final format used by the client
    const groupedTestCases = await migrateIncrementalGroupedTestCases(testMetadata, replayClient);

    return groupedTestCases;
  },
});
