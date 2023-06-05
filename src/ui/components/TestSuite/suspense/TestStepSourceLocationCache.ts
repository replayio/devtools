import { Location } from "@replayio/protocol";
import { gte } from "semver";

import { framesCache } from "replay-next/src/suspense/FrameCache";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { createCacheWithTelemetry } from "replay-next/src/utils/suspense";
import { ReplayClientInterface } from "shared/client/types";
import { GroupedTestCases, UserActionEvent } from "shared/test-suites/types";

export const TestStepSourceLocationCache = createCacheWithTelemetry<
  [client: ReplayClientInterface, groupedTestCases: GroupedTestCases, testEvent: UserActionEvent],
  Location | undefined
>({
  debugLabel: "TestStepSourceLocationCache",
  getKey: ([client, groupedTestCases, testEvent]) =>
    `${groupedTestCases.title}:${testEvent.data.id}`,
  load: async ([client, groupedTestCases, testEvent]) => {
    const runner = groupedTestCases.environment.testRunner.name;
    const runnerVersion = groupedTestCases.environment.testRunner.version;

    if (runner === "cypress" && runnerVersion) {
      const { viewSourceTimeStampedPoint } = testEvent.data;
      const pauseId = await pauseIdCache.readAsync(
        client,
        viewSourceTimeStampedPoint.point,
        viewSourceTimeStampedPoint.time
      );
      const frames = await framesCache.readAsync(client, pauseId);

      if (frames) {
        if (gte(runnerVersion, "8.0.0")) {
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

            const frame = userFrames.find((f, i, l) => {
              if (isChaiAssertion) {
                // if this is a chai assertion, the invocation was synchronous in this
                // call stack so we're looking from the top for the first frame that
                // isn't from the same source as the marker to identify the user frame
                // that invoke it
                return f.functionLocation?.every(fl => fl.sourceId !== markerSourceId);
              } else {
                // for enqueued assertions, search from the top for the first frame from the same source
                // as the marker (which should be cypress_runner.js) and return it
                return l[i + 1]?.functionLocation?.some(fl => fl.sourceId === markerSourceId);
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
