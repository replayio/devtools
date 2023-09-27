import { Node, ObjectId, PauseId } from "@replayio/protocol";

import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientInterface } from "shared/client/types";

export function getDistanceFromRoot({
  nodeId,
  node,
  pauseId,
  replayClient,
  rootNodeId,
}: {
  nodeId: ObjectId;
  node: Node;
  pauseId: PauseId;
  replayClient: ReplayClientInterface;
  rootNodeId: ObjectId;
}): number {
  let distanceFromRoot = 0;

  let currentNodeId: ObjectId | undefined = nodeId;
  let currentNode: Node | undefined = node;

  while (true) {
    if (currentNode == null || currentNodeId === rootNodeId) {
      break;
    }

    distanceFromRoot++;

    currentNodeId = currentNode.parentNode;
    currentNode = currentNodeId
      ? objectCache.getValueIfCached(replayClient, pauseId, currentNodeId, "canOverflow")?.preview
          ?.node
      : undefined;
  }

  return distanceFromRoot;
}
