import {
  BoxModel,
  EventListener,
  NodeBounds,
  PauseData,
  PauseId,
  ProtocolClient,
  Object as ProtocolObject,
} from "@replayio/protocol";

import { createGenericCache } from "replay-next/src/suspense/createGenericCache";
import { getObjectWithPreviewHelper } from "replay-next/src/suspense/ObjectPreviews";
import { cachePauseData } from "replay-next/src/suspense/PauseCache";
import { ReplayClientInterface } from "shared/client/types";

type NodeFetchOptions =
  | {
      type: "node";
      nodeId: string;
    }
  | {
      type: "document";
    }
  | {
      type: "parentNodes";
      nodeId: string;
    }
  | {
      type: "querySelector";
      nodeId: string;
      selector: string;
    }
  | {
      type: "searchDOM";
      query: string;
    }
  | {
      type: "childNodes";
      nodeId: string;
    };
export function assertUnreachable(_x: never): never {
  throw new Error("Didn't expect to get here");
}

export const {
  getValueSuspense: getNodeDataSuspense,
  getValueAsync: getNodeDataAsync,
  getValueIfCached: getNodeDataIfCached,
} = createGenericCache<
  [client: ProtocolClient, replayClient: ReplayClientInterface, sessionId: string],
  [pauseId: PauseId, options: NodeFetchOptions],
  ProtocolObject[]
>(
  "nodeCaches: getNodeData",
  3,
  async (client, replayClient, sessionId, pauseId, options) => {
    let nodeIds: string[] = [];
    let pauseData = null as PauseData | null;

    switch (options.type) {
      case "node": {
        nodeIds.push(options.nodeId);
        break;
      }
      case "document": {
        const { document, data } = await client.DOM.getDocument({}, sessionId, pauseId);
        nodeIds.push(document);
        pauseData = data;
        break;
      }
      case "parentNodes": {
        const { data } = await client.DOM.getParentNodes(
          {
            node: options.nodeId,
          },
          sessionId,
          pauseId
        );
        pauseData = data;
        // Ancestor nodes will be cached too, but we'll just return
        nodeIds.push(options.nodeId);
        break;
      }
      case "childNodes": {
        const nodeObject = await getObjectWithPreviewHelper(replayClient, pauseId, options.nodeId);

        nodeIds = nodeObject?.preview?.node?.childNodes ?? [];

        break;
      }
      case "querySelector": {
        const { result, data } = await client.DOM.querySelector(
          {
            node: options.nodeId,
            selector: options.selector,
          },
          sessionId,
          pauseId
        );
        pauseData = data;
        if (result) {
          nodeIds.push(result);
        }
        break;
      }
      case "searchDOM": {
        const { nodes, data } = await client.DOM.performSearch(
          {
            query: options.query,
          },
          sessionId,
          pauseId
        );
        pauseData = data;
        nodeIds = nodes;
        break;
      }
      default: {
        return assertUnreachable(options);
      }
    }

    if (pauseData) {
      cachePauseData(replayClient, pauseId, pauseData);
    }

    if (!nodeIds.length) {
      return [];
    }

    const nodePromises = nodeIds.map(nodeId =>
      getObjectWithPreviewHelper(replayClient, pauseId, nodeId)
    );

    return Promise.all(nodePromises);
  },
  (pauseId, options) => {
    let typeKey = "";

    switch (options.type) {
      case "node":
      case "parentNodes":
      case "childNodes": {
        typeKey = options.nodeId;
        break;
      }
      case "document": {
        break;
      }
      case "querySelector": {
        typeKey = `${options.nodeId}|${options.selector}`;
        break;
      }
      case "searchDOM": {
        typeKey = options.query;
        break;
      }
      default: {
        return assertUnreachable(options);
      }
    }

    return `${pauseId}|${options.type}|${typeKey}`;
  }
);

export const {
  getValueSuspense: getNodeEventListenersSuspense,
  getValueAsync: getNodeEventListenersAsync,
  getValueIfCached: getNodeEventListenersIfCached,
} = createGenericCache<
  [client: ProtocolClient, replayClient: ReplayClientInterface, sessionId: string],
  [pauseId: PauseId, nodeId: string],
  EventListener[] | undefined
>(
  "nodeCaches: getNodeEventListeners",
  3,
  async (client, replayClient, sessionId, pauseId, nodeId) => {
    const { listeners, data } = await client.DOM.getEventListeners(
      {
        node: nodeId,
      },
      sessionId,
      pauseId
    );
    cachePauseData(replayClient, pauseId, data);

    return listeners;
  },
  (pauseId, nodeId) => `${pauseId}|${nodeId}`
);

export const {
  getValueSuspense: getBoundingRectsSuspense,
  getValueAsync: getBoundingRectsAsync,
  getValueIfCached: getBoundingRectsIfCached,
} = createGenericCache<
  [client: ProtocolClient, sessionId: string],
  [pauseId: PauseId],
  NodeBounds[]
>(
  "nodeCaches: getBoundingRects",
  2,
  async (client, sessionId, pauseId) => {
    const { elements } = await client.DOM.getAllBoundingClientRects({}, sessionId, pauseId);
    return elements;
  },
  pauseId => `${pauseId}`
);

export const {
  getValueSuspense: getBoxModelSuspense,
  getValueAsync: getBoxModelAsync,
  getValueIfCached: getBoxModelIfCached,
} = createGenericCache<
  [client: ProtocolClient, sessionId: string],
  [pauseId: PauseId, nodeId: string],
  BoxModel
>(
  "nodeCaches: getBoxModel",
  2,
  async (client, sessionId, pauseId, nodeId) => {
    const { model: nodeBoxModel } = await client.DOM.getBoxModel(
      {
        node: nodeId,
      },
      sessionId,
      pauseId
    );

    return nodeBoxModel;
  },
  (pauseId, nodeId) => `${pauseId}|${nodeId}`
);

export function getMouseTarget(
  mouseTargets: NodeBounds[],
  x: number,
  y: number,
  nodeIds?: string[]
) {
  for (let nodeBounds of mouseTargets) {
    let { node, rect, rects, clipBounds, visibility, pointerEvents } = nodeBounds;
    if (nodeIds && !nodeIds.includes(node)) {
      continue;
    }
    if (visibility === "hidden" || pointerEvents === "none") {
      continue;
    }
    if (
      (clipBounds?.left !== undefined && x < clipBounds.left) ||
      (clipBounds?.right !== undefined && x > clipBounds.right) ||
      (clipBounds?.top !== undefined && y < clipBounds.top) ||
      (clipBounds?.bottom !== undefined && y > clipBounds.bottom)
    ) {
      continue;
    }

    // in the protocol, rects is set to undefined if there is only one rect
    rects ||= [rect];
    for (const r of rects) {
      const [left, top, right, bottom] = r;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        return nodeBounds;
      }
    }
  }
  return null;
}
