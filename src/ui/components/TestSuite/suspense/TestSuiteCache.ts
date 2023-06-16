import assert from "assert";
import { RecordingId } from "@replayio/protocol";

import { createSingleEntryCacheWithTelemetry } from "replay-next/src/utils/suspense";
import { ReplayClientInterface } from "shared/client/types";
import {
  GroupedTestCases,
  isGroupedTestCasesV1,
  processGroupedTestCases,
} from "shared/test-suites/RecordingTestMetadata";
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
    if (isGroupedTestCasesV1(testMetadata)) {
      return null;
    }

    // Migrate intermediate test data to the final format used by the client
    const groupedTestCases = await processGroupedTestCases(testMetadata, replayClient);

    return groupedTestCases;
  },
});
