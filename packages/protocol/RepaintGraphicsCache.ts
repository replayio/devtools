import { ExecutionPoint, repaintGraphicsResult } from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { mergedPaintsAndRepaints } from "protocol/PaintsCache";
import { paintHashCache } from "replay-next/src/suspense/PaintHashCache";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { insert } from "replay-next/src/utils/array";
import { compareExecutionPoints } from "replay-next/src/utils/time";
import { ReplayClientInterface, TimeStampedPointWithPaintHash } from "shared/client/types";

export const RepaintGraphicsCache: Cache<
  [replayClient: ReplayClientInterface, time: number, executionPoint: ExecutionPoint],
  repaintGraphicsResult | null
> = createCache({
  config: { immutable: true },
  debugLabel: "RepaintGraphicsCache",
  getKey: ([replayClient, time, executionPoint]) => executionPoint,
  load: async ([replayClient, time, executionPoint]) => {
    const pauseId = await pauseIdCache.readAsync(replayClient, executionPoint, time);
    const result = await replayClient.repaintGraphics(pauseId);

    let { description, screenShot } = result;

    // The backend won't return a screenshot for a given hash more than once; see FE-2357
    if (screenShot) {
      paintHashCache.cacheValue(screenShot, description.hash);

      // Merge repaint data with cached paint data so the find-nearest-paint methods can use both
      insert(
        mergedPaintsAndRepaints,
        {
          paintHash: description.hash,
          point: executionPoint,
          time: time,
        } satisfies TimeStampedPointWithPaintHash,
        (a, b) => compareExecutionPoints(a.point, b.point)
      );
    } else {
      screenShot = paintHashCache.getValueIfCached(description.hash);
    }

    return {
      description,
      screenShot,
    };
  },
});
