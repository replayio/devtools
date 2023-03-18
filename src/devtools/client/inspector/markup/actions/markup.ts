import { ProtocolClient, Object as ProtocolObject } from "@replayio/protocol";

import { paused } from "devtools/client/debugger/src/reducers/pause";
import NodeConstants from "devtools/shared/dom-node-constants";
import { Deferred, assert, defer } from "protocol/utils";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientInterface } from "shared/client/types";
import { ProtocolError, isCommandError } from "shared/utils/error";
import type { UIStore, UIThunkAction } from "ui/actions";
import { isInspectorSelected } from "ui/reducers/app";
import { AppStartListening } from "ui/setup/listenerMiddleware";
import { UIState } from "ui/state";
import { boxModelCache, nodeDataCache, nodeEventListenersCache } from "ui/suspense/nodeCaches";
import { boundingRectCache, computedStyleCache } from "ui/suspense/styleCaches";

import {
  NodeInfo,
  SelectionReason,
  childrenAdded,
  getSelectedDomNodeId,
  newRootAdded,
  nodeBoxModelsLoaded,
  nodeHighlightingCleared,
  nodeSelected,
  nodesHighlighted,
  resetMarkup,
  updateChildrenLoading,
  updateLoadingFailed,
  updateNodeExpanded,
  updateScrollIntoViewNode,
} from "../reducers/markup";
import {
  getNodeInfo,
  getParentNodeId,
  getSelectedNodeId,
  isNodeExpanded,
} from "../selectors/markup";

let rootNodeWaiter: Deferred<void> | undefined;

export function setupMarkup(store: UIStore, startAppListening: AppStartListening) {
  // Any time a new node is selected in the "Markup" panel,
  // check to see if the "Elements" panel is actually visible.
  // If so, update our selection in Redux, including expanding ancestor nodes.

  startAppListening({
    actionCreator: nodeSelected,
    effect: async (action, listenerApi) => {
      const { getState, dispatch } = listenerApi;
      const state = getState();
      const { selectedNode, selectionReason } = state.markup;

      if (!isInspectorSelected(state) || !selectedNode) {
        return;
      }

      // Ignore any `nodeSelected` actions dispatched during `selectionChanged` (could cause an infinite loop)
      listenerApi.unsubscribe();

      await dispatch(
        selectionChanged(selectionReason === "navigateaway", selectionReason !== "markup")
      );

      // Restore listening to `nodeSelected`
      listenerApi.subscribe();
    },
  });

  // Any time the app is paused, clear out all fetched DOM nodes,
  // and reload the "Markup" panel.
  startAppListening({
    actionCreator: paused,
    effect: async (action, listenerApi) => {
      const { condition, dispatch, getState, cancelActiveListeners, extra } = listenerApi;
      const { ThreadFront, replayClient, protocolClient } = extra;

      cancelActiveListeners();

      const originalPauseId = await ThreadFront.getCurrentPauseId(replayClient);

      // every time we pause, clear the existing DOM node info
      dispatch(reset());

      async function loadNewDocument() {
        await ThreadFront.ensureAllSources();

        // Clear selection if pauses have differed
        const selectedNodeId = getSelectedDomNodeId(getState());

        if (selectedNodeId && ThreadFront.currentPauseIdUnsafe !== originalPauseId) {
          dispatch(nodeSelected(null));
          return;
        }

        // Clear out and reset all the node tree data
        await dispatch(newRoot());
        if (ThreadFront.currentPauseIdUnsafe !== originalPauseId) {
          return;
        }

        const latestSelectedNodeId = getSelectedDomNodeId(getState());

        if (latestSelectedNodeId) {
          dispatch(selectionChanged(false));
        } else {
          const [rootNode] = await nodeDataCache.readAsync(
            protocolClient,
            replayClient,
            ThreadFront.sessionId!,
            originalPauseId!,
            { type: "document" }
          );

          if (!rootNode || ThreadFront.currentPauseIdUnsafe !== originalPauseId) {
            return;
          }

          const selectedNodeId = getSelectedDomNodeId(getState());
          const [defaultNode] = await nodeDataCache.readAsync(
            protocolClient,
            replayClient,
            ThreadFront.sessionId!,
            originalPauseId!,
            { type: "querySelector", nodeId: rootNode.objectId, selector: "body" }
          );

          if (
            defaultNode &&
            !selectedNodeId &&
            ThreadFront.currentPauseIdUnsafe === originalPauseId
          ) {
            dispatch(nodeSelected(defaultNode.objectId, "navigateaway"));
          }
        }
      }

      if (!isInspectorSelected(getState())) {
        await condition((action, currState) => {
          return isInspectorSelected(currState);
        });
      }

      try {
        await loadNewDocument();
      } catch (error) {
        if (isCommandError(error, ProtocolError.DocumentIsUnavailable)) {
          // The document is not available at the current execution point.
          // We should inform the user (rather than remaining in a visual loading state).
          // When the execution point changes we will try again.
          dispatch(updateLoadingFailed(true));
        } else {
          throw error;
        }
      }
    },
  });
}

/**
 * Clears the tree
 */
export function reset() {
  if (rootNodeWaiter) {
    rootNodeWaiter.resolve();
  }
  rootNodeWaiter = defer();
  return resetMarkup();
}

/**
 * Clears the tree and adds the new root node.
 */
export function newRoot(): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { ThreadFront, replayClient, protocolClient }) => {
    const originalPauseId = await ThreadFront.getCurrentPauseId(replayClient);

    const [rootNodeData] = await nodeDataCache.readAsync(
      protocolClient,
      replayClient,
      ThreadFront.sessionId!,
      originalPauseId,
      { type: "document" }
    );

    if (!rootNodeData || ThreadFront.currentPauseIdUnsafe !== originalPauseId) {
      return;
    }
    const rootNode = await convertNode(
      rootNodeData.objectId,
      replayClient,
      protocolClient,
      ThreadFront.sessionId!,
      originalPauseId
    );

    if (ThreadFront.currentPauseIdUnsafe !== originalPauseId) {
      return;
    }

    dispatch(newRootAdded(rootNode));
    if (rootNodeWaiter) {
      rootNodeWaiter.resolve();
      rootNodeWaiter = undefined;
    }
  };
}

/**
 * Adds the children of a node to the tree and updates the parent's `children` property.
 */
export function addChildren(
  parentNodeId: string,
  childNodes: ProtocolObject[]
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { ThreadFront, replayClient, protocolClient }) => {
    let childrenToAdd = childNodes;

    // Filter out whitespace nodes (formerly a pref option)
    childrenToAdd = childNodes.filter(nodeObject => {
      const node = nodeObject?.preview?.node;
      if (!node) {
        return false;
      }
      return node.nodeType !== NodeConstants.TEXT_NODE || /[^\s]/.exec(node.nodeValue!);
    });

    const originalPauseId = await ThreadFront.getCurrentPauseId(replayClient);

    // Always ensure we have a parent
    const parent = await convertNode(
      parentNodeId,
      replayClient,
      protocolClient,
      ThreadFront.sessionId!,
      originalPauseId!
    );

    const children = await Promise.all(
      childrenToAdd.map(node =>
        convertNode(
          node.objectId,
          replayClient,
          protocolClient,
          ThreadFront.sessionId!,
          originalPauseId!
        )
      )
    );

    if (ThreadFront.currentPauseIdUnsafe !== originalPauseId) {
      return;
    }

    dispatch(childrenAdded({ parent, children }));
  };
}

export function collapseNode(nodeId: string) {
  return updateNodeExpanded({ nodeId, isExpanded: false });
}

export function toggleNodeExpanded(nodeId: string, isExpanded: boolean): UIThunkAction {
  return (dispatch, getState, { ThreadFront }) => {
    if (isExpanded) {
      dispatch(collapseNode(nodeId));
    } else {
      dispatch(expandNode(nodeId));
    }

    dispatch(nodeSelected(nodeId));
  };
}

/**
 * Expand the given node after ensuring its child nodes are loaded and added to the tree.
 * If shouldScrollIntoView is true, the node is scrolled into view if its children need to be loaded.
 */
export function expandNode(
  nodeId: string,
  shouldScrollIntoView = false
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { ThreadFront, replayClient, protocolClient }) => {
    const node = getNodeInfo(getState(), nodeId);
    assert(node, "node not found in markup state");

    if (node.isExpanded && !node.isLoadingChildren) {
      return;
    }

    dispatch(updateNodeExpanded({ nodeId, isExpanded: true }));

    if (node.hasChildren && node.children.length === 0) {
      dispatch(updateChildrenLoading({ nodeId, isLoadingChildren: true }));
      if (shouldScrollIntoView) {
        dispatch(updateScrollIntoViewNode(node.id));
      }

      const originalPauseId = await ThreadFront.getCurrentPauseId(replayClient);

      const childNodes = await nodeDataCache.readAsync(
        protocolClient,
        replayClient,
        ThreadFront.sessionId!,
        originalPauseId,
        { type: "childNodes", nodeId }
      );

      if (ThreadFront.currentPauseIdUnsafe !== originalPauseId) {
        return;
      }
      await dispatch(addChildren(nodeId, childNodes));

      if (ThreadFront.currentPauseIdUnsafe !== originalPauseId) {
        return;
      }
      dispatch(updateChildrenLoading({ nodeId, isLoadingChildren: false }));
    }
  };
}

/**
 * Update the tree to show the currently selected node.
 * If shouldScrollIntoView is true, the selected node is scrolled into view. If any of its
 * ancestors' children haven't been loaded yet, those ancestors will also be scrolled into view
 * while their children are loaded.
 */
export function selectionChanged(
  expandSelectedNode: boolean,
  shouldScrollIntoView = false
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { replayClient, ThreadFront }) => {
    const selectedNodeId = getSelectedDomNodeId(getState());

    if (!selectedNodeId) {
      dispatch(nodeSelected(null));
      return;
    }

    if (rootNodeWaiter) {
      await rootNodeWaiter.promise;
    }

    let latestSelectedNodeId = getSelectedDomNodeId(getState());
    if (latestSelectedNodeId !== selectedNodeId) {
      return;
    }

    const pauseId = await ThreadFront.getCurrentPauseId(replayClient);

    dispatch(nodeSelected(latestSelectedNodeId));

    // collect the selected node's ancestors in top-down order
    const selectedNode = await objectCache.readAsync(
      replayClient,
      pauseId,
      latestSelectedNodeId,
      "canOverflow"
    );
    let ancestors: string[] = [];

    let ancestorId = expandSelectedNode
      ? latestSelectedNodeId
      : selectedNode.preview?.node?.parentNode;

    while (ancestorId) {
      ancestors.unshift(ancestorId);

      const node = await objectCache.readAsync(replayClient, pauseId, ancestorId, "canOverflow");
      ancestorId = node?.preview?.node?.parentNode;
    }

    // expand each ancestor, loading its children if necessary
    for (const ancestorId of ancestors) {
      await dispatch(expandNode(ancestorId, shouldScrollIntoView));
      latestSelectedNodeId = getSelectedDomNodeId(getState());
      if (latestSelectedNodeId !== selectedNodeId) {
        return;
      }
    }

    if (shouldScrollIntoView) {
      dispatch(updateScrollIntoViewNode(latestSelectedNodeId));
    }
  };
}

export function selectNode(nodeId: string, reason?: SelectionReason): UIThunkAction {
  return async (dispatch, getState, { ThreadFront, replayClient, protocolClient }) => {
    // Ensure we have the data loaded
    const originalPauseId = await ThreadFront.getCurrentPauseId(replayClient);
    const nodes = await nodeDataCache.readAsync(
      protocolClient,
      replayClient,
      ThreadFront.sessionId!,
      originalPauseId,
      { type: "parentNodes", nodeId }
    );

    if (nodes.length && ThreadFront.currentPauseIdUnsafe === originalPauseId) {
      dispatch(highlightNode(nodeId, 1000));

      dispatch(nodeSelected(nodeId, reason));
    }
  };
}

/**
 * Find the node that is
 * - a descendant of the specified node or that node itself
 * - displayed in the markup tree
 * - visually the last of all such nodes
 * and return its ID
 */
function getLastNodeId(state: UIState, nodeId: string) {
  while (true) {
    const nodeInfo = getNodeInfo(state, nodeId);
    if (!nodeInfo?.isExpanded || nodeInfo.children.length === 0) {
      return nodeId;
    }
    nodeId = nodeInfo.children[nodeInfo.children.length - 1];
  }
}

/**
 * Find the node that is displayed in the markup tree
 * immediately before the specified node and return its ID.
 */
function getPreviousNodeId(state: UIState, nodeId: string) {
  const parentNodeId = getParentNodeId(state, nodeId);
  if (!parentNodeId) {
    return nodeId;
  }
  const parentNodeInfo = getNodeInfo(state, parentNodeId);
  assert(parentNodeInfo, "parent node not found in markup state");
  if (parentNodeInfo.type === NodeConstants.DOCUMENT_TYPE_NODE) {
    return nodeId;
  }
  const index = parentNodeInfo.children.indexOf(nodeId);
  if (index >= 1) {
    return getLastNodeId(state, parentNodeInfo.children[index - 1]);
  }
  return parentNodeId;
}

/**
 * Find the node that is displayed in the markup tree
 * immediately after the specified node and return its ID.
 */
function getNextNodeId(state: UIState, nodeId: string) {
  if (isNodeExpanded(state, nodeId)) {
    const nodeInfo = getNodeInfo(state, nodeId);
    if (nodeInfo && nodeInfo.children.length > 0) {
      return nodeInfo.children[0];
    }
  }

  let currentNodeId = nodeId;
  let parentNodeId = getParentNodeId(state, currentNodeId);
  while (parentNodeId) {
    const siblingIds = getNodeInfo(state, parentNodeId)?.children;
    assert(siblingIds, "sibling nodes not found in markup state");
    const index = siblingIds.indexOf(currentNodeId);
    assert(index >= 0, "current node not found among siblings");
    if (index + 1 < siblingIds.length) {
      return siblingIds[index + 1];
    }
    currentNodeId = parentNodeId;
    parentNodeId = getParentNodeId(state, currentNodeId);
  }

  return nodeId;
}

export function onLeftKey(): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const selectedNodeId = getSelectedNodeId(state);
    if (selectedNodeId == null) {
      return;
    }

    if (isNodeExpanded(state, selectedNodeId)) {
      dispatch(updateNodeExpanded({ nodeId: selectedNodeId, isExpanded: false }));
    } else {
      const parentNodeId = getParentNodeId(state, selectedNodeId);
      if (parentNodeId != null) {
        const parentNodeInfo = getNodeInfo(state, parentNodeId);
        if (parentNodeInfo && parentNodeInfo.type !== NodeConstants.DOCUMENT_TYPE_NODE) {
          dispatch(selectNode(parentNodeId, "keyboard"));
        }
      }
    }
  };
}

export function onRightKey(): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const selectedNodeId = getSelectedNodeId(state);
    if (selectedNodeId == null) {
      return;
    }

    const selectedNodeInfo = getNodeInfo(state, selectedNodeId);
    assert(selectedNodeInfo, "selected node not found in markup state");
    if (!selectedNodeInfo.isExpanded || selectedNodeInfo.isLoadingChildren) {
      dispatch(expandNode(selectedNodeId, true));
    } else {
      const firstChildId = selectedNodeInfo.children[0];
      if (firstChildId != null) {
        dispatch(selectNode(firstChildId, "keyboard"));
        return;
      }
      const nextNodeId = getNextNodeId(state, selectedNodeId);
      dispatch(selectNode(nextNodeId, "keyboard"));
    }
  };
}

export function onUpKey(): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const selectedNodeId = getSelectedNodeId(state);
    if (selectedNodeId == null) {
      return;
    }

    const previousNodeId = getPreviousNodeId(state, selectedNodeId);
    dispatch(selectNode(previousNodeId, "keyboard"));
  };
}

export function onDownKey(): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const selectedNodeId = getSelectedNodeId(state);
    if (selectedNodeId == null) {
      return;
    }

    const nextNodeId = getNextNodeId(state, selectedNodeId);
    dispatch(selectNode(nextNodeId, "keyboard"));
  };
}

export function onPageUpKey(): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const selectedNodeId = getSelectedNodeId(state);
    if (selectedNodeId == null) {
      return;
    }

    let previousNodeId = selectedNodeId;
    for (let i = 0; i < 10; i++) {
      previousNodeId = getPreviousNodeId(state, previousNodeId);
    }
    dispatch(selectNode(previousNodeId, "keyboard"));
  };
}

export function onPageDownKey(): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const selectedNodeId = getSelectedNodeId(state);
    if (selectedNodeId == null) {
      return;
    }

    let nextNodeId: string | undefined = selectedNodeId;
    for (let i = 0; i < 10; i++) {
      nextNodeId = getNextNodeId(state, nextNodeId);
    }
    dispatch(selectNode(nextNodeId, "keyboard"));
  };
}

let unhighlightTimer: ReturnType<typeof window.setTimeout> | null = null;

export function highlightNodes(
  nodeIds: string[],
  pauseId?: string,
  duration?: number
): UIThunkAction {
  return async (dispatch, getState, { ThreadFront, protocolClient, replayClient }) => {
    const recordingCapabilities = await ThreadFront.getRecordingCapabilities();
    if (!recordingCapabilities.supportsRepaintingGraphics) {
      return;
    }

    if (nodeIds.length === 0) {
      return;
    }

    if (!pauseId) {
      // We're trying to highlight nodes from the current pause.
      pauseId = await ThreadFront.getCurrentPauseId(replayClient);
    }

    const { highlightedNodes } = getState().markup;
    if (!highlightedNodes || !nodeIds.every(id => highlightedNodes.includes(id))) {
      dispatch(nodesHighlighted(nodeIds));

      const boxModels = await Promise.all(
        nodeIds.map(async nodeId => {
          const boxModel = await boxModelCache.readAsync(
            protocolClient,
            ThreadFront.sessionId!,
            pauseId!,
            nodeId
          );
          return boxModel;
        })
      );
      dispatch(nodeBoxModelsLoaded(boxModels));

      if (unhighlightTimer) {
        clearTimeout(unhighlightTimer);
      }

      if (duration) {
        unhighlightTimer = setTimeout(() => {
          dispatch(unhighlightNode());
        }, duration);
      }
    }
  };
}

export function highlightNode(nodeId: string, duration?: number): UIThunkAction {
  return highlightNodes([nodeId], undefined, duration);
}

export function unhighlightNode(): UIThunkAction {
  return async (dispatch, getState) => {
    dispatch(nodeHighlightingCleared());
  };
}

export const searchDOM = (query: string): UIThunkAction<Promise<ProtocolObject[]>> => {
  return async (dispatch, getState, { ThreadFront, replayClient, protocolClient }) => {
    const state = getState();
    const pauseIdBefore = state.pause.id;
    const sessionId = state.app.sessionId;

    const results = await nodeDataCache.readAsync(
      protocolClient,
      replayClient,
      sessionId!,
      pauseIdBefore!,
      {
        type: "searchDOM",
        query,
      }
    );

    return results;
  };
};

export const getNodeBoundingRect = (
  nodeId: string
): UIThunkAction<Promise<DOMRect | undefined>> => {
  return async (dispatch, getState, { protocolClient }) => {
    const state = getState();
    const pauseId = state.pause.id;
    const sessionId = state.app.sessionId;

    return boundingRectCache.readAsync(protocolClient, sessionId!, pauseId!, nodeId);
  };
};

export const HTML_NS = "http://www.w3.org/1999/xhtml";

async function convertNode(
  nodeId: string,
  replayClient: ReplayClientInterface,
  client: ProtocolClient,
  sessionId: string,
  pauseId: string,
  { isExpanded = false } = {}
): Promise<NodeInfo> {
  const [nodeObject, computedStyle, eventListeners] = await Promise.all([
    objectCache.readAsync(replayClient, pauseId, nodeId, "canOverflow"),
    computedStyleCache.readAsync(client, sessionId, pauseId, nodeId),
    nodeEventListenersCache.readAsync(client, replayClient, sessionId, pauseId, nodeId),
  ]);

  const node = nodeObject?.preview?.node;
  assert(node, "No preview for node: " + nodeId);

  const displayType = computedStyle?.get("display");

  return {
    attributes: node.attributes || [],
    children: [],
    displayName:
      node.nodeType === NodeConstants.DOCUMENT_TYPE_NODE
        ? `<!DOCTYPE ${node.nodeName}>`
        : node.nodeName.toLowerCase(),
    displayType,
    hasChildren: !!node.childNodes?.length,
    hasEventListeners: !!eventListeners,
    id: nodeId,
    isConnected: node.isConnected,
    isDisplayed: !!displayType && displayType !== "none",
    isElement: node.nodeType === NodeConstants.ELEMENT_NODE,
    isExpanded,
    namespaceURI: HTML_NS,
    parentNodeId: node.parentNode,
    pseudoType: node.pseudoType!,
    tagName: node.nodeType === Node.ELEMENT_NODE ? node.nodeName : undefined,
    type: node.nodeType,
    value: node.nodeValue,
    isLoadingChildren: false,
  };
}
