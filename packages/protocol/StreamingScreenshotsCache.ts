import { ExecutionPoint, PauseId, ScreenShot, repaintGraphicsResult } from "@replayio/protocol";
import { Cache, createCache, createStreamingCache } from "suspense";

import { mostRecentPaint } from "protocol/PaintsCache";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { screenshotCache } from "replay-next/src/suspense/ScreenshotCache";
import { ReplayClientInterface } from "shared/client/types";

export const RepaintGraphicsCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId],
  repaintGraphicsResult | null
> = createCache({
  config: { immutable: true },
  debugLabel: "RepaintGraphicsCache",
  getKey: ([replayClient, pauseId]) => pauseId,
  load: async ([replayClient, pauseId]) => {
    return replayClient.repaintGraphics(pauseId);
  },
});

type StreamingScreenShotCacheStatus =
  | "complete"
  | "loading-imprecise"
  | "loading-precise"
  | "loading-failed";

export const StreamingScreenShotCache = createStreamingCache<
  [replayClient: ReplayClientInterface, time: number, executionPoint: ExecutionPoint | null],
  ScreenShot | undefined,
  StreamingScreenShotCacheStatus
>({
  debugLabel: "StreamingScreenShotCache",
  getKey: (replayClient, time, executionPoint) => `${time}:${executionPoint}`,
  load: async ({ update, resolve }, replayClient, time, executionPoint) => {
    let screenShot: ScreenShot | undefined = undefined;

    update(screenShot, 0, "loading-imprecise");

    let didLoadImpreciseScreenShot = false;

    const paintPoint = mostRecentPaint(time);
    if (paintPoint && paintPoint.time <= time) {
      screenShot = await screenshotCache.readAsync(
        replayClient,
        paintPoint.point,
        paintPoint.paintHash
      );

      didLoadImpreciseScreenShot = true;

      if (paintPoint.point == executionPoint) {
        update(screenShot, 1, "complete");
        resolve();

        return;
      } else {
        update(screenShot, 0.5, "loading-precise");
      }
    }

    if (executionPoint != null) {
      const pauseId = await pauseIdCache.readAsync(replayClient, executionPoint, time);

      try {
        const result = await RepaintGraphicsCache.readAsync(replayClient, pauseId);

        if (result?.screenShot) {
          screenShot = result.screenShot;

          update(screenShot, 1, "complete");
          resolve();

          return;
        }
      } catch (error) {
        console.error(error);
      }
    }

    // TRICKY:
    //
    // There are two scenarios where we need to update the graphics:
    // (1) The current execution point has changed (e.g. the timeline has changed)
    // (2) The user is hovering over something (like a test step)
    //
    // In the second case, we should fail quietly if there is no screenshot available.
    // In that event, the previous graphics for the current execution point– will remain visible.
    update(screenShot, 1, screenShot != null ? "complete" : "loading-failed");
    resolve();
  },
});
