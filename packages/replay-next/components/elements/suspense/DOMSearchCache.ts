import { ObjectId, PauseId } from "@replayio/protocol";
import { createCache } from "suspense";

import { cachePauseData } from "replay-next/src/suspense/PauseCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientInterface } from "shared/client/types";

export const domSearchCache = createCache<
  [replayClient: ReplayClientInterface, pauseId: PauseId, query: string],
  ObjectId[]
>({
  config: { immutable: true },
  debugLabel: "DOMSearchCache",
  getKey: ([replayClient, pauseId, query]) => `${pauseId}:${query}`,
  load: async ([replayClient, pauseId, query]) => {
    const { nodes, data } = await replayClient.performSearch(pauseId, query);

    if (data) {
      const sources = await sourcesByIdCache.readAsync(replayClient);
      cachePauseData(replayClient, sources, pauseId, data);
    }

    return nodes;
  },
});
