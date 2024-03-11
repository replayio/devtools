import assert from "assert";
import { Node, ObjectId, PauseId } from "@replayio/protocol";
import { createCache } from "suspense";

import { shouldDisplayNode } from "replay-next/components/elements-new/utils/shouldDisplayNode";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientInterface } from "shared/client/types";

// Unlike Object preview Nodes (from the objectCache),
// Elements are pre-filtered to remove child nodes that shouldn't be shown (like empty text nodes)
export type Element = {
  filteredChildNodeIds: ObjectId[];
  id: ObjectId;
  node: Node;
};

export const elementCache = createCache<
  [replayClient: ReplayClientInterface, pauseId: PauseId, id: ObjectId],
  Element
>({
  config: { immutable: true },
  debugLabel: "ElementCache",
  getKey: ([replayClient, pauseId, id]) => `${pauseId}:${id}`,
  load: async ([replayClient, pauseId, id]) => {
    const object = await objectCache.readAsync(replayClient, pauseId, id, "canOverflow");
    const node = object.preview?.node;
    assert(node);

    const childNodeIds = node.childNodes ?? [];

    // Pre-fetch immediate children as well so we can filter out types that shouldn't be shown (like empty text nodes)
    const filteredChildNodeIds: ObjectId[] = new Array(childNodeIds.length);

    // Fetch in parallel but preserve a stable order; it's important for display
    await Promise.all(
      childNodeIds.map((childId, index) =>
        (async () => {
          const object = await objectCache.readAsync(replayClient, pauseId, childId, "canOverflow");
          const node = object.preview?.node;
          assert(node);
          if (shouldDisplayNode(node)) {
            filteredChildNodeIds[index] = childId;
          }
        })()
      )
    );

    return {
      filteredChildNodeIds: filteredChildNodeIds.filter(Boolean),
      id,
      node,
    };
  },
});
