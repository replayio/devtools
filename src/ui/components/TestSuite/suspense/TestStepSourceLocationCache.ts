import assert from "assert";
import { Frame, Location } from "@replayio/protocol";
import { compare } from "compare-versions";
import { Cache } from "suspense";

import { framesCache } from "replay-next/src/suspense/FrameCache";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { createCacheWithTelemetry } from "replay-next/src/utils/suspense";
import { ReplayClientInterface } from "shared/client/types";
import {
  GroupedTestCases,
  TestEvent,
  UserActionEvent,
  isUserActionTestEvent,
} from "shared/test-suites/RecordingTestMetadata";

function getCypressMarkerFrame(frames: Frame[]) {
  const markerFrameIndex = frames.findIndex(
    (f: any, i: any, l: any) => f.functionName === "__stackReplacementMarker"
  );

  if (markerFrameIndex !== -1) {
    return markerFrameIndex;
  }

  // For requests that are dispatched from a Cypress promise handler, we
  // don't always see __stackReplacemenMarker so we have to derive the
  // callsite from the sourceIds

  // the current frame will be the plugin source
  let pluginSourceId = frames[0].functionLocation?.[0].sourceId;
  let cypressSourceId: string | undefined;
  let userSourceId: string | undefined;

  for (let i = 1; i < frames.length; i++) {
    const sourceId = frames[i].functionLocation?.[0].sourceId;
    if (!cypressSourceId && sourceId !== pluginSourceId) {
      // The first non-plugin source will be cypress
      cypressSourceId = sourceId;
    } else if (cypressSourceId && !userSourceId && sourceId !== cypressSourceId) {
      // the next non-cypress code will be userland code
      userSourceId = sourceId;
    } else if (cypressSourceId && userSourceId && sourceId === cypressSourceId) {
      // when we land back in cypress code, use that as the marker frame
      return i;
    }
  }

  return -1;
}

export const TestStepSourceLocationCache: Cache<
  [
    client: ReplayClientInterface,
    groupedTestCases: GroupedTestCases,
    testEvent: UserActionEvent,
    testEvents: TestEvent[]
  ],
  Location | undefined
> = createCacheWithTelemetry({
  debugLabel: "TestStepSourceLocationCache",
  getKey: ([client, groupedTestCases, testEvent]) =>
    `${groupedTestCases.source.title}:${testEvent.data.id}`,
  load: async ([client, groupedTestCases, testEvent, testEvents]) => {
    const runner = groupedTestCases.environment.testRunner.name;
    const runnerVersion = groupedTestCases.environment.testRunner.version;

    if (runner === "cypress" && runnerVersion) {
      const { viewSource } = testEvent.data.timeStampedPoints;
      assert(viewSource !== null);

      const pauseId = await pauseIdCache.readAsync(client, viewSource.point, viewSource.time);
      const frames = await framesCache.readAsync(client, pauseId);

      if (frames) {
        if (compare(runnerVersion, "8.0.0", ">=")) {
          const markerFrameIndex = getCypressMarkerFrame(frames);
          if (markerFrameIndex < 0) {
            if (testEvent.data.parentId) {
              // If we couldn't find a marker frame,
              // the parent event location would still be a meaningful place to jump to
              const parentId = testEvent.data.parentId;
              const parentTestEvent = testEvents.find(
                testEvent => isUserActionTestEvent(testEvent) && testEvent.data.id === parentId
              );
              if (parentTestEvent) {
                return await TestStepSourceLocationCache.readAsync(
                  client,
                  groupedTestCases,
                  parentTestEvent as UserActionEvent,
                  testEvents
                );
              }
            }
          }

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
