import { ObjectId, PauseId } from "@replayio/protocol";
import { createCache } from "suspense";

import { cachePauseData } from "replay-next/src/suspense/PauseCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientInterface } from "shared/client/types";

export const rootObjectIdCache = createCache<
  [replayClient: ReplayClientInterface, pauseId: PauseId],
  ObjectId
>({
  config: { immutable: true },
  debugLabel: "RootObjectIdCache",
  getKey: ([replayClient, pauseId]) => pauseId,
  load: async ([replayClient, pauseId]) => {
    const { document: rootObjectId, data } = await replayClient.getDocument(pauseId);

    if (data) {
      const sources = await sourcesByIdCache.readAsync(replayClient);
      cachePauseData(replayClient, sources, pauseId, data);
    }

    return rootObjectId;
  },
});
