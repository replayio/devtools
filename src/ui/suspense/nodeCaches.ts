import {
  BoxModel,
  EventListener,
  NodeBounds,
  PauseData,
  PauseId,
  ProtocolClient,
  Object as ProtocolObject,
  Quads,
} from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { NodeInfo } from "devtools/client/inspector/markup/reducers/markup";
import NodeConstants from "devtools/shared/dom-node-constants";
import { Deferred, assert, defer } from "protocol/utils";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { cachePauseData } from "replay-next/src/suspense/PauseCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientInterface } from "shared/client/types";

import { computedStyleCache } from "./styleCaches";

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

export const ancestorNodesCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId, nodeId: string],
  NodeInfo[] | null
> = createCache({
  config: { immutable: true },
  debugLabel: "AncestorNodesData",
  getKey: ([replayClient, pauseId, nodeId]) => `${pauseId}:${nodeId}`,
  load: async ([replayClient, pauseId, nodeId]): Promise<NodeInfo[] | null> => {
    if (!pauseId || typeof nodeId !== "string") {
      return null;
    }

    const nodes: NodeInfo[] = [];

    let ancestorId: string | null = nodeId;

    while (ancestorId) {
      const node = await processedNodeDataCache.readAsync(replayClient, pauseId, ancestorId);
      ancestorId = node?.parentNodeId ?? null;
      if (node) {
        nodes.unshift(node);
      }
    }

    return nodes;
  },
});

export const reIsNotWhiteSpace = /[^\s]/;

export const canRenderNodeInfo = (childNode: NodeInfo | null): childNode is NodeInfo => {
  if (!childNode) {
    return false;
  }

  const canRender = !!(
    childNode.type !== NodeConstants.TEXT_NODE || reIsNotWhiteSpace.exec(childNode.value!)
  );
  return canRender;
};

export const getCurrentRenderableChildNodeIds = (
  replayClient: ReplayClientInterface,
  pauseId: string,
  parentNode: NodeInfo,
  renderableChildNodes: NodeInfo[] | null | undefined
) => {
  let childNodeIds: string[] = [];

  if (renderableChildNodes) {
    // We have the complete list of all _renderable_ child nodes.
    childNodeIds = renderableChildNodes.map(node => node.id);
  } else {
    // Only try to render children that are already in cache.
    // This should only happen when the user selects a deeply nested node,
    // in which case we have _some_ children available but may not have all.
    // The renderable cache request should resolve shortly and then
    // we'll use that list instead.
    childNodeIds = parentNode.children.filter(childNodeId => {
      const maybeNode = processedNodeDataCache.getValueIfCached(replayClient, pauseId, childNodeId);
      return !!maybeNode && canRenderNodeInfo(maybeNode);
    });
  }

  return childNodeIds;
};

// TODO [FE-1846???] The backend returns _all_ child nodes in the preview,
// and we have no way of knowing which ones are renderable..
// We've asked for a way to filter out the ones that aren't renderable on the server.
// Until then, we'll filter them out here.
// ref: https://linear.app/replay/issue/FE-1846/investigate-honeycomb-telemetry-that-can-help-us-see-which-getboxmodel#comment-0fb1c7e6
// TODO [BAC-3918]Similarly, this would _really_ benefit from
// a way to bulk-fetch object previews
export const renderableChildNodesCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId, nodeId: string],
  NodeInfo[] | null
> = createCache({
  config: { immutable: true },
  debugLabel: "ChildNodesData",
  getKey: ([replayClient, pauseId, nodeId]) => `${pauseId}:${nodeId}`,
  load: async ([replayClient, pauseId, nodeId]): Promise<NodeInfo[] | null> => {
    if (!pauseId || typeof nodeId !== "string") {
      return null;
    }

    const parentNode = await processedNodeDataCache.readAsync(replayClient, pauseId, nodeId);

    if (!parentNode) {
      return null;
    }

    const childNodes: (NodeInfo | null)[] = await Promise.all(
      parentNode.children.map(childNodeId => {
        return processedNodeDataCache.readAsync(replayClient, pauseId, childNodeId);
      })
    );

    const renderableChildNodes: NodeInfo[] = childNodes.filter(canRenderNodeInfo);

    return renderableChildNodes;
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

const TAGS_WITHOUT_BOX_MODELS = ["head", "link", "title", "meta", "script", "noscript", "style"];

const EMPTY_QUADS: Quads = [0, 0, 0, 0, 0, 0, 0, 0];
const NO_BOX_MODEL: BoxModel = {
  node: "",
  border: EMPTY_QUADS,
  content: EMPTY_QUADS,
  margin: EMPTY_QUADS,
  padding: EMPTY_QUADS,
};

export function canHighlightNode(node: NodeInfo) {
  const canHighlight =
    node.type === NodeConstants.ELEMENT_NODE && !TAGS_WITHOUT_BOX_MODELS.includes(node.displayName);
  return canHighlight;
}

export const boxModelCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId, nodeId: string],
  BoxModel
> = createCache({
  config: { immutable: true },
  debugLabel: "BoxModel",
  getKey: ([replayClient, pauseId, nodeId]) => `${pauseId}:${nodeId}`,
  load: async ([replayClient, pauseId, nodeId]) => {
    if (!pauseId || !nodeId) {
      return NO_BOX_MODEL;
    }
    const nodeObject = processedNodeDataCache.getValueIfCached(replayClient, pauseId, nodeId);

    const nodeMayBeHighlightable = nodeObject && canHighlightNode(nodeObject);
    let nodeIsVisible = true;

    if (nodeMayBeHighlightable) {
      // Only do the computed style check once we know
      // if you can even highlight this node
      const computedStyle = await computedStyleCache.readAsync(replayClient, pauseId, nodeId);
      const displayValue = computedStyle?.get("display");
      nodeIsVisible = displayValue !== "none";
    }

    const canFetchBoxModel = nodeMayBeHighlightable && nodeIsVisible;

    if (!canFetchBoxModel) {
      // Return a fake entry with no size
      return {
        ...NO_BOX_MODEL,
        node: nodeId,
      };
    }

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
