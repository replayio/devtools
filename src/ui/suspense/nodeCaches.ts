import assert from "assert";
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

import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { cachePauseData } from "replay-next/src/suspense/PauseCache";
import { sourcesCache } from "replay-next/src/suspense/SourcesCache";
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

function assertUnreachable(_x: never): never {
  throw new Error("Didn't expect to get here");
}

export const nodeDataCache: Cache<
  [
    protocolClient: ProtocolClient,
    replayClient: ReplayClientInterface,
    sessionId: string,
    pauseId: PauseId,
    options: NodeFetchOptions
  ],
  ProtocolObject[]
> = createCache({
  config: { immutable: true },
  debugLabel: "NodeData",
  getKey: ([protocolClient, replayClient, sessionId, pauseId, options]) => {
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
  load: async ([protocolClient, replayClient, sessionId, pauseId, options]) => {
    let nodeIds: string[] = [];
    let pauseData = null as PauseData | null;

    switch (options.type) {
      case "node": {
        nodeIds.push(options.nodeId);
        break;
      }
      case "document": {
        const { document, data } = await protocolClient.DOM.getDocument({}, sessionId, pauseId);
        nodeIds.push(document);
        pauseData = data;
        break;
      }
      case "parentNodes": {
        const { data } = await protocolClient.DOM.getParentNodes(
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
        const { result, data } = await protocolClient.DOM.querySelector(
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
        const { nodes, data } = await protocolClient.DOM.performSearch(
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
      const { value: { idToSource } = {} } = await sourcesCache.readAsync(replayClient);
      assert(idToSource != null);

      cachePauseData(replayClient, idToSource, pauseId, pauseData);
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

export const nodeEventListenersCache: Cache<
  [
    protocolClient: ProtocolClient,
    replayClient: ReplayClientInterface,
    sessionId: string,
    pauseId: PauseId,
    nodeId: string
  ],
  EventListener[] | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "NodeEventListeners",
  getKey: ([protocolClient, replayClient, sessionId, pauseId, nodeId]) => `${pauseId}:${nodeId}`,
  load: async ([protocolClient, replayClient, sessionId, pauseId, nodeId]) => {
    const { listeners, data } = await protocolClient.DOM.getEventListeners(
      {
        node: nodeId,
      },
      sessionId,
      pauseId
    );

    const { value: { idToSource } = {} } = await sourcesCache.readAsync(replayClient);
    assert(idToSource != null);

    cachePauseData(replayClient, idToSource, pauseId, data);

    return listeners;
  },
});

export const boundingRectsCache: Cache<
  [protocolClient: ProtocolClient, sessionId: string, pauseId: PauseId],
  NodeBounds[]
> = createCache({
  config: { immutable: true },
  debugLabel: "BoundingRects",
  getKey: ([protocolClient, sessionId, pauseId]) => pauseId,
  load: async ([protocolClient, sessionId, pauseId]) => {
    const { elements } = await protocolClient.DOM.getAllBoundingClientRects({}, sessionId, pauseId);
    return elements;
  },
});

export const boxModelCache: Cache<
  [protocolClient: ProtocolClient, sessionId: string, pauseId: PauseId, nodeId: string],
  BoxModel
> = createCache({
  config: { immutable: true },
  debugLabel: "BoxModel",
  getKey: ([protocolClient, sessionId, pauseId, nodeId]) => `${pauseId}:${nodeId}`,
  load: async ([protocolClient, sessionId, pauseId, nodeId]) => {
    const { model: nodeBoxModel } = await protocolClient.DOM.getBoxModel(
      {
        node: nodeId,
      },
      sessionId,
      pauseId
    );
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
