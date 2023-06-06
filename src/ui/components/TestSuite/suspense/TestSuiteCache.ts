import assert from "assert";
import { RecordingId } from "@replayio/protocol";

import { createSingleEntryCacheWithTelemetry } from "replay-next/src/utils/suspense";
import { ReplayClientInterface } from "shared/client/types";
import { migrateIncrementalGroupedTestCases } from "shared/test-suites/migrateIncrementalGroupedTestCases";
import { GroupedTestCases } from "shared/test-suites/types";
import { RecordingCache } from "ui/components/TestSuite/suspense/RecordingCache";

export const TestSuiteCache = createSingleEntryCacheWithTelemetry<
  [replayClient: ReplayClientInterface, recordingId: RecordingId],
  GroupedTestCases
>({
  debugLabel: "TestSuiteCache",
  load: async ([replayClient, recordingId]) => {
    const recording = await RecordingCache.readAsync(recordingId);

    const metadata = recording.metadata;
    assert(metadata != null);
    assert(metadata.test != null);

    // Migrate intermediate test data to the final format used by the client
    const groupedTestCases = await migrateIncrementalGroupedTestCases(metadata.test, replayClient);

    return groupedTestCases;
  },
});
