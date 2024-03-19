import { ExecutionPoint, ScreenShot } from "@replayio/protocol";
import { createCache, createExternallyManagedCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";

export const screenshotCache = createCache<
  [replayClient: ReplayClientInterface, point: ExecutionPoint, paintHash: string],
  ScreenShot
>({
  config: { immutable: true },
  debugLabel: "ScreenshotCache",
  getKey: ([client, point, paintHash]) => paintHash,
  load: async ([client, point]) => {
    const screenShot = await client.getScreenshot(point);

    paintHashCache.cacheValue(screenShot, screenShot.hash);

    return screenShot;
  },
});

// The backend won't return a screenshot for a given hash more than once; see FE-2357
export const paintHashCache = createExternallyManagedCache<[paintHash: string], ScreenShot>({
  config: { immutable: true },
  debugLabel: "paintHashCache",
  getKey: ([paintHash]) => paintHash,
});
