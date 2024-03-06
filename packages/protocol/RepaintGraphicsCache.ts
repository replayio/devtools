import { PauseId, repaintGraphicsResult } from "@replayio/protocol";
import { Cache, createCache } from "suspense";

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
