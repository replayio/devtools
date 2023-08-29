import {
  BoxModel,
  EventListener,
  NodeBounds,
  PauseData,
  PauseId,
  ProtocolClient,
  Object as ProtocolObject,
} from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { NodeInfo } from "devtools/client/inspector/markup/reducers/markup";
import NodeConstants from "devtools/shared/dom-node-constants";
import { Deferred, assert, defer } from "protocol/utils";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { cachePauseData } from "replay-next/src/suspense/PauseCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
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

export const HTML_NS = "http://www.w3.org/1999/xhtml";

function assertUnreachable(_x: never): never {
  throw new Error("Didn't expect to get here");
}

export const nodeDataCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId, options: NodeFetchOptions],
  ProtocolObject[]
> = createCache({
  config: { immutable: true },
  debugLabel: "NodeData",
  getKey: ([replayClient, pauseId, options]) => {
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

    return `${pauseId}:${options.type}:${typeKey}`;
  },
  load: async ([replayClient, pauseId, options]) => {
    let nodeIds: string[] = [];
    let pauseData = null as PauseData | null;

    switch (options.type) {
      case "node": {
        nodeIds.push(options.nodeId);
        break;
      }
      case "document": {
        const { document, data } = await replayClient.getDocument(pauseId);
        nodeIds.push(document);
        pauseData = data;
        break;
      }
      case "parentNodes": {
        const { data } = await replayClient.getParentNodes(pauseId, options.nodeId);
        pauseData = data;
        // Ancestor nodes will be cached too, but we'll just return
        nodeIds.push(options.nodeId);
        break;
      }
      case "childNodes": {
        const nodeObject = await objectCache.readAsync(
          replayClient,
          pauseId,
          options.nodeId,
          "canOverflow"
        );

        nodeIds = nodeObject?.preview?.node?.childNodes ?? [];

        break;
      }
      case "querySelector": {
        const { result, data } = await replayClient.querySelector(
          pauseId,
          options.nodeId,
          options.selector
        );
        pauseData = data;
        if (result) {
          nodeIds.push(result);
        }
        break;
      }
      case "searchDOM": {
        const { nodes, data } = await replayClient.performSearch(pauseId, options.query);
        pauseData = data;
        nodeIds = nodes;
        break;
      }
      default: {
        return assertUnreachable(options);
      }
    }

    if (pauseData) {
      const sources = await sourcesByIdCache.readAsync(replayClient);
      cachePauseData(replayClient, sources, pauseId, pauseData);
    }

    if (!nodeIds.length) {
      return [];
    }

    const nodePromises = nodeIds.map(nodeId =>
      objectCache.readAsync(replayClient, pauseId, nodeId, "canOverflow")
    );

    return Promise.all(nodePromises);
  },
});

export const processedNodeDataCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId, nodeId: string],
  NodeInfo | null
> = createCache({
  config: { immutable: true },
  debugLabel: "ProcessedNodeData",
  getKey: ([replayClient, pauseId, nodeId]) => `${pauseId}:${nodeId}`,
  load: async ([replayClient, pauseId, nodeId]): Promise<NodeInfo | null> => {
    if (!pauseId || typeof nodeId !== "string") {
      return null;
    }
    const nodeObject = await objectCache.readAsync(replayClient, pauseId, nodeId, "canOverflow");

    const node = nodeObject?.preview?.node;
    assert(node, "No preview for node: " + nodeId);

    return {
      attributes: node.attributes || [],
      children: node.childNodes ?? [],
      displayName:
        node.nodeType === NodeConstants.DOCUMENT_TYPE_NODE
          ? `<!DOCTYPE ${node.nodeName}>`
          : node.nodeName.toLowerCase(),
      hasChildren: !!node.childNodes?.length,
      id: nodeId,
      isConnected: node.isConnected,
      isElement: node.nodeType === NodeConstants.ELEMENT_NODE,
      namespaceURI: HTML_NS,
      parentNodeId: node.parentNode,
      pseudoType: node.pseudoType!,
      tagName: node.nodeType === Node.ELEMENT_NODE ? node.nodeName : undefined,
      type: node.nodeType,
      value: node.nodeValue,
      isLoadingChildren: false,
    };
  },
});

export const nodeEventListenersCache: Cache<
  [replayClient: ReplayClientInterface, sessionId: string, pauseId: PauseId, nodeId: string],
  EventListener[] | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "NodeEventListeners",
  getKey: ([replayClient, sessionId, pauseId, nodeId]) => `${pauseId}:${nodeId}`,
  load: async ([replayClient, sessionId, pauseId, nodeId]) => {
    const { listeners, data } = await replayClient.getEventListeners(pauseId, nodeId);
    const sources = await sourcesByIdCache.readAsync(replayClient);
    cachePauseData(replayClient, sources, pauseId, data);

    return listeners;
  },
});

export const boundingRectsCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId],
  NodeBounds[]
> = createCache({
  config: { immutable: true },
  debugLabel: "BoundingRects",
  getKey: ([replayClient, pauseId]) => pauseId,
  load: async ([replayClient, pauseId]) => {
    const { elements } = await replayClient.getAllBoundingClientRects(pauseId);
    return elements;
  },
});

export const boxModelCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId, nodeId: string],
  BoxModel
> = createCache({
  config: { immutable: true },
  debugLabel: "BoxModel",
  getKey: ([replayClient, pauseId, nodeId]) => `${pauseId}:${nodeId}`,
  load: async ([replayClient, pauseId, nodeId]) => {
    const { model: nodeBoxModel } = await replayClient.getBoxModel(pauseId, nodeId);
    return nodeBoxModel;
  },
});

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
