import { ExecutionPoint, ScreenShot, Video } from "@replayio/protocol";
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

export const videoCache = createCache<
  [replayClient: ReplayClientInterface],
  Video[]
>({
  config: { immutable: true },
  debugLabel: "ScreenshotCache",
  getKey: ([client]) => client.getRecordingId() || "",
  load: async ([client]) => {
    const videos = await client.getVideos();
    return videos;
  },
});
