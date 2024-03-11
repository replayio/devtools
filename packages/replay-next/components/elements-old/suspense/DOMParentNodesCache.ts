import { ObjectId, PauseId } from "@replayio/protocol";
import { createCache } from "suspense";

import { elementCache } from "replay-next/components/elements-old/suspense/ElementCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { cachePauseData } from "replay-next/src/suspense/PauseCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientInterface } from "shared/client/types";

export const parentNodesCache = createCache<
  [replayClient: ReplayClientInterface, pauseId: PauseId, leafNodeId: ObjectId],
  ObjectId[]
>({
  config: { immutable: true },
  debugLabel: "parentNodesCache",
  getKey: ([replayClient, pauseId, leafNodeId]) => `${pauseId}:${leafNodeId}`,
  load: async ([replayClient, pauseId, leafNodeId]) => {
    const { data } = await replayClient.getParentNodes(pauseId, leafNodeId);

    if (data) {
      const sources = await sourcesByIdCache.readAsync(replayClient);
      cachePauseData(replayClient, sources, pauseId, data);
    }

    const ids: ObjectId[] = [];

    let currentId: ObjectId | undefined = leafNodeId;
    while (currentId != null) {
      ids.unshift(currentId);

      // Use the object preview cache rather than the Elements cache,
      // because the Elements cache also loads immediate children.
      const prefetchedObject = objectCache.read(replayClient, pauseId, currentId, "canOverflow");

      currentId = prefetchedObject.preview?.node?.parentNode;
    }

    return ids;
  },
});
