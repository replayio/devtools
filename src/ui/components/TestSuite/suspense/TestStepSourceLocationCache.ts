import assert from "assert";
import { Location } from "@replayio/protocol";
import { compare } from "compare-versions";

import { framesCache } from "replay-next/src/suspense/FrameCache";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { createCacheWithTelemetry } from "replay-next/src/utils/suspense";
import { ReplayClientInterface } from "shared/client/types";
import { GroupedTestCases, UserActionEvent } from "shared/test-suites/RecordingTestMetadata";

export const TestStepSourceLocationCache = createCacheWithTelemetry<
  [client: ReplayClientInterface, groupedTestCases: GroupedTestCases, testEvent: UserActionEvent],
  Location | undefined
>({
  debugLabel: "TestStepSourceLocationCache",
  getKey: ([client, groupedTestCases, testEvent]) =>
    `${groupedTestCases.source.title}:${testEvent.data.id}`,
  load: async ([client, groupedTestCases, testEvent]) => {
    const runner = groupedTestCases.environment.testRunner.name;
    const runnerVersion = groupedTestCases.environment.testRunner.version;

    if (runner === "cypress" && runnerVersion) {
      const { viewSource } = testEvent.data.timeStampedPoints;
      assert(viewSource !== null);

      const pauseId = await pauseIdCache.readAsync(client, viewSource.point, viewSource.time);
      const frames = await framesCache.readAsync(client, pauseId);

      if (frames) {
        if (compare(runnerVersion, "8.0.0", ">=")) {
          // find the cypress marker frame
          const markerFrameIndex = frames.findIndex(
            (f: any, i: any, l: any) => f.functionName === "__stackReplacementMarker"
          );

          // and extract its sourceId
          const markerSourceId = frames[markerFrameIndex]?.functionLocation?.[0].sourceId;
          if (markerSourceId) {
            // slice the frames from the current to the marker frame and reverse
            // it so the user frames are on top
            const userFrames = frames?.slice(0, markerFrameIndex).reverse();

            const isChaiAssertion = testEvent.data.command.name === "assert";
            // TODO [FE-1419] const isChaiAssertion = testStep.data.name === "assert" && !annotations?.enqueue;

            const frame = userFrames.find((currentFrame, currentFrameIndex) => {
              if (isChaiAssertion) {
                // if this is a chai assertion, the invocation was synchronous in this
                // call stack so we're looking from the top for the first frame that
                // isn't from the same source as the marker to identify the user frame
                // that invoke it
                return currentFrame.functionLocation?.every(fl => fl.sourceId !== markerSourceId);
              } else if (
                !currentFrame.functionLocation?.some(fl => fl.sourceId === markerSourceId)
              ) {
                // for enqueued assertions, the source will generally be the
                // first location that isn't the same as the marker (which is
                // the cypress_runner).
                //
                // The frames array is usually one of the two:
                // * [
                //     addAnnotation and related plugin code,
                //     cypress code for the cy.* command in cypress_runner,
                //     user code,
                //     __stackReplacementMarker in cypress_runner
                //   ]
                // * [
                //     addAnnotation and related plugin code,
                //     cypress code for the cy.* command in cypress_runner,
                //     user code,
                //     wrapper code like for cy.then in cypress_runner
                //     __stackReplacementMarker in cypress_runner
                //   ]
                //
                // We find it by looking from the top (the frames array comes in
                // with the most recent last but it is reversed above) for the
                // first entry that isn't from the cypress_runner where the
                // _next_ frame is from the cypress_runner.

                return userFrames[currentFrameIndex + 1]?.functionLocation?.some(
                  fl => fl.sourceId === markerSourceId
                );
              } else {
                return false;
              }
            });

            return frame?.location[frame.location.length - 1];
          }
        } else {
          // find the cypress marker frame
          const markerFrameIndex = frames.findIndex((f: any, i: any, l: any) =>
            f.functionName?.startsWith("injectHtmlAndBootAlpine")
          );

          // the user frame should be right before injectHtmlAndBootAlpine
          const frame = frames[markerFrameIndex - 1];

          return frame?.location[frame.location.length - 1];
        }
      }
    }

    return undefined;
  },
});
