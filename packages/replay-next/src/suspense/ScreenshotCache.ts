import { ExecutionPoint, ScreenShot } from "@replayio/protocol";
import { createCache } from "suspense";

import { paintHashCache } from "replay-next/src/suspense/PaintHashCache";
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
