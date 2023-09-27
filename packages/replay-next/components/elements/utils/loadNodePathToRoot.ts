import { ObjectId, PauseId } from "@replayio/protocol";

import { elementCache } from "replay-next/components/elements/suspense/ElementCache";
import { ReplayClientInterface } from "shared/client/types";

export function loadNodePathToRoot(
  replayClient: ReplayClientInterface,
  pauseId: PauseId,
  leafNodeId: ObjectId
): Promise<ObjectId[]> {
  const ids: ObjectId[] = [];

  const loadNode = async (
    id: ObjectId,
    resolve: (ids: ObjectId[]) => void,
    reject: (error: any) => void
  ) => {
    ids.unshift(id);

    let element = await elementCache.readAsync(replayClient, pauseId, id);
    if (element == null) {
      try {
        element = await elementCache.readAsync(replayClient, pauseId, id);
      } catch (error) {
        reject(error);
        return;
      }
    }

    if (element.node.parentNode == null) {
      resolve(ids);
    } else {
      loadNode(element.node.parentNode, resolve, reject);
    }
  };

  return new Promise<ObjectId[]>((resolve, reject) => {
    loadNode(leafNodeId, resolve, reject);
  });
}
