import { PauseId, repaintGraphicsResult } from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { paintHashCache } from "replay-next/src/suspense/ScreenshotCache";
import { ReplayClientInterface } from "shared/client/types";

export const RepaintGraphicsCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId],
  repaintGraphicsResult | null
> = createCache({
  config: { immutable: true },
  debugLabel: "RepaintGraphicsCache",
  getKey: ([replayClient, pauseId]) => pauseId,
  load: async ([replayClient, pauseId]) => {
    const result = await replayClient.repaintGraphics(pauseId);

    let { description, screenShot } = result;

    // The backend won't return a screenshot for a given hash more than once; see FE-2357
    if (screenShot) {
      paintHashCache.cacheValue(screenShot, description.hash);
    } else {
      screenShot = paintHashCache.getValueIfCached(description.hash);
    }

    return {
      description,
      screenShot,
    };
  },
});
