import { RecordingId } from "@replayio/protocol";

import { createSingleEntryCacheWithTelemetry } from "replay-next/src/utils/suspense";
import { RecordingCache } from "ui/components/TestSuite/suspense/RecordingCache";
import {
  ProcessedTestMetadata,
  ProcessedTestMetadataResultCounts,
} from "ui/components/TestSuite/types";
import validateTestMetadata from "ui/components/TestSuite/utils/validateTestMetadata";

// Processes TestMetadata into a format more usable by the TestSuite UI.
// This cache depends on only Recording data (from GraphQL) and should load quickly.
export const TestMetadataCache = createSingleEntryCacheWithTelemetry<
  [recordingId: RecordingId],
  ProcessedTestMetadata
>({
  debugLabel: "TestMetadataCache",
  load: async ([recordingId]) => {
    const recording = await RecordingCache.readAsync(recordingId);
    const testMetadata = validateTestMetadata(recording);

    const { result, title, runner = null, tests: testItems = [], version } = testMetadata;

    const duration = testItems.reduce((duration, test) => duration + (test.duration ?? 0), 0);

    const resultCounts: ProcessedTestMetadataResultCounts = {
      failed: 0,
      passed: 0,
      skipped: 0,
    };

    let stepsCount = 0;

    testItems.forEach(testItem => {
      const { steps = [] } = testItem;

      stepsCount += steps.length;

      switch (testItem.result) {
        case "failed":
        case "timedOut":
          resultCounts.failed++;
          break;
        case "passed":
          resultCounts.passed++;
          break;
        case "skipped":
          resultCounts.skipped++;
          break;
      }
    });

    let hasMissingSteps = false;
    switch (testMetadata.runner?.name) {
      case "cypress":
      case "playwright":
        hasMissingSteps = stepsCount === 0;
        break;
    }

    return {
      duration,
      hasMissingSteps,
      result,
      resultCounts,
      runner,
      title,
      version,
    };
  },
});
