import { ExecutionPoint, PauseId, ScreenShot, repaintGraphicsResult } from "@replayio/protocol";
import { Cache, createCache, createStreamingCache } from "suspense";

import { PaintsCache, findMostRecentPaint } from "protocol/PaintsCache";
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
  | "fetching-cached-paint"
  | "fetching-repaint"
  | "loading-failed";

export const StreamingScreenShotCache = createStreamingCache<
  [replayClient: ReplayClientInterface, time: number, executionPoint: ExecutionPoint | null],
  ScreenShot | undefined,
  StreamingScreenShotCacheStatus
>({
  debugLabel: "StreamingScreenShotCache",
  getKey: (replayClient, time, executionPoint) => `${time}:${executionPoint}`,
  load: async ({ update, reject, resolve }, replayClient, time, executionPoint) => {
    let screenShot: ScreenShot | undefined = undefined;

    update(screenShot, 0, "fetching-cached-paint");

    let didLoadImpreciseScreenShot = false;

    // Wait for paints to (finish) loading
    await PaintsCache.readAsync();

    const paintPoint = findMostRecentPaint(time);

    if (paintPoint && paintPoint.paintHash) {
      try {
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
          update(screenShot, 0.5, "fetching-repaint");
        }
      } catch (error) {
        update(undefined, 1, "loading-failed");
        reject(error);

        return;
      }
    }

    if (executionPoint && executionPoint !== "0") {
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
    // In the second case, only a time value will be specified.
    // So long as we can load a cached screenshot this cache should be considered complete.
    update(screenShot, 1, screenShot != null ? "complete" : "loading-failed");
    resolve();
  },
});
