import { ExecutionPoint, ScreenShot } from "@replayio/protocol";
import { createCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";

export const screenshotCache = createCache<
  [replayClient: ReplayClientInterface, point: ExecutionPoint, paintHash: string],
  ScreenShot
>({
  config: { immutable: true },
  debugLabel: "ScreenshotCache",
  getKey: ([client, point, paintHash]) => paintHash,
  load: ([client, point]) => client.getScreenshot(point),
});
