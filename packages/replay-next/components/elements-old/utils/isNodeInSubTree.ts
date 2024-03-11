import { Node, ObjectId, PauseId } from "@replayio/protocol";

import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientInterface } from "shared/client/types";

export function isNodeInSubTree(
  replayClient: ReplayClientInterface,
  pauseId: PauseId,
  leafNodeId: ObjectId,
  rootNodeId: ObjectId
) {
  if (leafNodeId === rootNodeId) {
    return false;
  }

  let currentNodeId: ObjectId | undefined = leafNodeId;

  while (currentNodeId) {
    if (currentNodeId === rootNodeId) {
      return true;
    }

    const object = objectCache.getValueIfCached(
      replayClient,
      pauseId,
      currentNodeId,
      "canOverflow"
    );

    currentNodeId = object && object?.preview?.node?.parentNode;
  }

  return false;
}
