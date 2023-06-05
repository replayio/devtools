import { RecordingId } from "@replayio/protocol";

import { createSingleEntryCacheWithTelemetry } from "replay-next/src/utils/suspense";
import { ReplayClientInterface } from "shared/client/types";
import { convertIncrementalGroupedTestCasesToFullGroupedTestCases } from "shared/test-suites/convertIncrementalGroupedTestCasesToFullGroupedTestCases";
import { GroupedTestCases, IncrementalGroupedTestCases } from "shared/test-suites/types";
import { RecordingCache } from "ui/components/TestSuite/suspense/RecordingCache";

export const TestSuiteCache = createSingleEntryCacheWithTelemetry<
  [replayClient: ReplayClientInterface, recordingId: RecordingId],
  GroupedTestCases
>({
  debugLabel: "TestSuiteCache",
  load: async ([replayClient, recordingId]) => {
    const recording = await RecordingCache.readAsync(recordingId);

    // TODO [FE-1419] For the time being, we need to pre-process this data a bit
    // we shouldn't have to do this once the backend provides the correct format
    const {
      date,
      environment,
      resultCounts: _resultCounts,
      schemaVersion,
      source,
      tests,
    } = recording.metadata!.test! as any;
    const tempIncrementalGroupedTestCases: IncrementalGroupedTestCases = {
      // TODO [FE-1419] This should come from the server
      // For what it's worth, the client sets this based on annotations later at least
      approximateDuration: recording.duration || 0,
      date: date ?? recording.date,
      environment,
      filePath: source.filePath,
      resultCounts: _resultCounts,
      schemaVersion,
      // TODO [FE-1419] This should come from the server;
      // Maybe we can backfill it with test.metadata.source (if it's present)
      source: null,
      testRecordings: tests.map((test: any) => {
        const { actions, error = null, ...rest } = test;

        // TODO [FE-1419] map "actions" to "events" until the server does
        const events = {} as any;
        for (let key in actions) {
          events[key] = actions[key].map((event: any) => {
            const { category, command, error, id, parentId, scope, timeStampedPointRange, type } =
              event;

            // TODO [FE-1419] Move event data inside of the "data" attribute until the server does
            return {
              data: {
                category,
                command,
                error,
                id,
                parentId,
                scope,
              },
              timeStampedPointRange,
              type,
            };
          });
        }

        return {
          ...rest,
          error,
          events,
        };
      }),
      title: source.title,
    };

    // Migrate intermediate test data to the final format used by the client
    const groupedTestCases = await convertIncrementalGroupedTestCasesToFullGroupedTestCases(
      tempIncrementalGroupedTestCases,
      replayClient
    );

    // TODO [FE-1419] Extra approximate duration based on processed annotations;
    // we shouldn't have to do this once the backend provides this value
    if (groupedTestCases.testRecordings.length > 0) {
      const firstTestRecording = groupedTestCases.testRecordings[0];
      const lastTestRecording =
        groupedTestCases.testRecordings[groupedTestCases.testRecordings.length - 1];

      groupedTestCases.approximateDuration =
        lastTestRecording.timeStampedPointRange.end.time -
        firstTestRecording.timeStampedPointRange.begin.time;
    }

    return groupedTestCases;
  },
});
