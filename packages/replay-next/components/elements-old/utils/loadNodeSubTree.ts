import { ObjectId, PauseId } from "@replayio/protocol";

import { Element, elementCache } from "replay-next/components/elements-old/suspense/ElementCache";
import { getDistanceFromRoot } from "replay-next/components/elements-old/utils/getDistanceFromRoot";
import { ReplayClientInterface } from "shared/client/types";

export function loadNodeSubTree(
  replayClient: ReplayClientInterface,
  pauseId: PauseId,
  rootId: ObjectId,
  numLevelsToLoad: number = 0
) {
  const loadedIds: Set<ObjectId> = new Set();
  const pendingIds: Set<ObjectId> = new Set();

  const loadNode = async (
    id: ObjectId,
    resolve: (ids: Set<ObjectId>) => void,
    reject: (error: any) => void
  ) => {
    // Add all ids to the pending Set, even if cached;
    // This prevents a recursive call from prematurely resolving the root Promise
    pendingIds.add(id);

    // Add the id to the loaded Set before processing the subtree
    // The list of loaded nodes must be processed top-down so that bubbled values work
    // Also add before loading non-cached results to preserve the order of the tree
    loadedIds.add(id);

    let element: Element;
    try {
      element = await elementCache.readAsync(replayClient, pauseId, id);
    } catch (error) {
      reject(error);
      return;
    }

    const childNodes = element.filteredChildNodeIds;

    const distanceFromRoot = getDistanceFromRoot({
      nodeId: id,
      node: element.node,
      pauseId,
      replayClient,
      rootNodeId: rootId,
    });

    if (distanceFromRoot <= numLevelsToLoad) {
      childNodes.forEach(id => {
        loadNode(id, resolve, reject);
      });
    }

    pendingIds.delete(id);
    if (pendingIds.size === 0) {
      resolve(loadedIds);
    }
  };

  return new Promise<Set<ObjectId>>((resolve, reject) => {
    loadNode(rootId, resolve, reject);
  });
}
