import assert from "assert";
import { Node, ObjectId, PauseId } from "@replayio/protocol";
import { createCache } from "suspense";

import { shouldDisplayNode } from "replay-next/components/elements/utils/shouldDisplayNode";
import { fetchBatchedObjectPreviews, objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientInterface } from "shared/client/types";

// Unlike Object preview Nodes (from the objectCache),
// Elements are pre-filtered to remove child nodes that shouldn't be shown (like empty text nodes)
export type Element = {
  filteredChildNodeIds: ObjectId[];
  id: ObjectId;
  node: Node;
};

export async function fetchBatchedElements(
  client: ReplayClientInterface,
  pauseId: PauseId,
  parentNodesObjectIds: ObjectId[]
): Promise<Set<ObjectId>> {
  console.group("fetchBatchedElements() ids:", Array.from(parentNodesObjectIds).join(", "));
  const objectIdsToLoad: ObjectId[] = [];

  for (let index = 0; index < parentNodesObjectIds.length; index++) {
    const nodeId = parentNodesObjectIds[index];
    const node = objectCache.getValue(client, pauseId, nodeId, "canOverflow");
    console.log("  -> crawling", nodeId);
    console.log("  -> crawling children", ...(node.preview?.node?.childNodes ?? []));

    objectIdsToLoad.push(nodeId);
    if (node.preview?.node?.childNodes) {
      objectIdsToLoad.push(...node.preview.node.childNodes);
    }
  }

  console.log("Fetching", objectIdsToLoad.join(", "));
  await fetchBatchedObjectPreviews(client, pauseId, objectIdsToLoad, "canOverflow");

  for (let index = 0; index < parentNodesObjectIds.length; index++) {
    const nodeId = parentNodesObjectIds[index];

    console.log("  -> pre-reading", nodeId);
    await elementCache.readAsync(client, pauseId, nodeId);
  }

  console.log("Loaded", objectIdsToLoad.join(", "));
  console.groupEnd();
  return new Set(objectIdsToLoad);
}

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
