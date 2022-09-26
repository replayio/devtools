import {
  PauseId,
  ProtocolClient,
  Object as ProtocolObject,
  Node as ProtocolNode,
  PauseData,
  EventListener,
} from "@replayio/protocol";
import uniqBy from "lodash/uniqBy";

import { createGenericCache } from "bvaughn-architecture-demo/src/suspense/createGenericCache";
import {
  getObjectWithPreviewHelper,
  preCacheObjects,
} from "bvaughn-architecture-demo/src/suspense/ObjectPreviews";

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
  [
    client: ProtocolClient,
    replayClient: ReplayClientInterface,
    sessionId: string,
    pauseId: PauseId,
    options: NodeFetchOptions
  ],
  ProtocolObject[]
>(
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

    if (pauseData?.objects) {
      preCacheObjects(pauseId, pauseData.objects);
    }

    if (!nodeIds.length) {
      return [];
    }

    const nodePromises = nodeIds.map(nodeId =>
      getObjectWithPreviewHelper(replayClient, pauseId, nodeId)
    );

    return Promise.all(nodePromises);
  },
  (client, replayClient, sessionId, pauseId, options) => {
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
  [client: ProtocolClient, sessionId: string, pauseId: PauseId, nodeId: string],
  EventListener[] | undefined
>(
  async (client, sessionId, pauseId, nodeId) => {
    const { listeners, data } = await client.DOM.getEventListeners(
      {
        node: nodeId,
      },
      sessionId,
      pauseId
    );
    preCacheObjects(pauseId, data?.objects);

    return listeners;
  },
  (client, sessionId, pauseId, nodeId) => `${pauseId}|${nodeId}`
);
