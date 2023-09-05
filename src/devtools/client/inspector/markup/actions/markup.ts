import { TaskAbortError } from "@reduxjs/toolkit";
import { Object as ProtocolObject } from "@replayio/protocol";

import { paused } from "devtools/client/debugger/src/reducers/pause";
import NodeConstants from "devtools/shared/dom-node-constants";
import { Deferred, assert, defer } from "protocol/utils";
import { recordingCapabilitiesCache } from "replay-next/src/suspense/BuildIdCache";
import { ReplayClientInterface } from "shared/client/types";
import { ProtocolError, isCommandError } from "shared/utils/error";
import type { UIStore, UIThunkAction } from "ui/actions";
import { isInspectorSelected } from "ui/reducers/app";
import { AppStartListening } from "ui/setup/listenerMiddleware";
import { UIState } from "ui/state";
import {
  ancestorNodesCache,
  boxModelCache,
  getCurrentRenderableChildNodeIds,
  nodeDataCache,
  processedNodeDataCache,
  renderableChildNodesCache,
} from "ui/suspense/nodeCaches";
import { boundingRectCache } from "ui/suspense/styleCaches";

import {
  SelectionReason,
  expandMultipleNodes,
  getSelectedDomNodeId,
  newRootAdded,
  nodeBoxModelsLoaded,
  nodeHighlightingCleared,
  nodeSelected,
  nodesHighlighted,
  resetMarkup,
  updateLoadingFailed,
  updateNodeExpanded,
  updateScrollIntoViewNode,
} from "../reducers/markup";
import { getIsNodeExpanded, getSelectedNodeId } from "../selectors/markup";

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
      const { ThreadFront, replayClient } = extra;

      cancelActiveListeners();

      // Our `state.markup` section has already been cleared out
      // by the time we get here, from the `pauseRequestedAt` action.

      const originalPauseId = await ThreadFront.getCurrentPauseId(replayClient);

      async function throwIfCanceled() {
        // Cancel-aware - see if this is still the current pause
        // We'll have this added to RTK at some point
        await listenerApi.delay(0);
      }

      async function loadNewDocument() {
        // Get the document node object preview so we know its object ID
        const [rootNodePreview] = await nodeDataCache.readAsync(replayClient, originalPauseId, {
          type: "document",
        });
        // Also pre-fetch the formatted root node data
        const rootNode = (await processedNodeDataCache.readAsync(
          replayClient,
          originalPauseId,
          rootNodePreview.objectId
        ))!;

        await throwIfCanceled();

        dispatch(newRootAdded(rootNode.id));
        if (rootNodeWaiter) {
          rootNodeWaiter.resolve();
          rootNodeWaiter = undefined;
        }

        const latestSelectedNodeId = getSelectedDomNodeId(getState());

        if (latestSelectedNodeId) {
          dispatch(selectionChanged(false));
        } else {
          // We don't know _which_ node should be selected by default.
          // Load the body and select it.
          const [defaultNode] = await nodeDataCache.readAsync(replayClient, originalPauseId!, {
            type: "querySelector",
            nodeId: rootNode.id,
            selector: "body",
          });

          await throwIfCanceled();

          const selectedNodeId = getSelectedDomNodeId(getState());

          if (defaultNode && !selectedNodeId) {
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
        // Cancel-aware - see if this is still the current pause
        await listenerApi.pause(loadNewDocument());
      } catch (error) {
        // RTK listeners can be canceled and will throw,
        // so we can use that as an indicator the pause changed.
        const listenerWasCanceled = error instanceof TaskAbortError;

        if (isCommandError(error, ProtocolError.DocumentIsUnavailable)) {
          // The document is not available at the current execution point.
          // We should inform the user (rather than remaining in a visual loading state).
          // When the execution point changes we will try again.
          dispatch(updateLoadingFailed(true));
        } else if (!listenerWasCanceled) {
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
    const isExpanded = getIsNodeExpanded(getState(), nodeId);

    if (isExpanded) {
      return;
    }

    const pauseId = ThreadFront.currentPauseIdUnsafe;
    if (pauseId) {
      // Start loading the child nodes even before we
      // try to render the expanded node.
      // Note that we DO NOT wait for this to complete!
      renderableChildNodesCache.readAsync(replayClient, pauseId, nodeId);
    }

    dispatch(updateNodeExpanded({ nodeId, isExpanded: true }));
    if (shouldScrollIntoView) {
      dispatch(updateScrollIntoViewNode(nodeId));
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

    // This part _should_ run quickly, because we should have fetched
    // parent nodes over in `selectNode()`
    // Note that this list includes the selected node itself
    const parsedNodeAncestors = await ancestorNodesCache.readAsync(
      replayClient,
      pauseId,
      latestSelectedNodeId
    );

    // These should be in top-down order
    let ancestorIds = parsedNodeAncestors?.map(node => node.id) ?? [];

    if (!expandSelectedNode) {
      ancestorIds = ancestorIds.filter(id => id !== latestSelectedNodeId);
    }

    ancestorIds.map(nodeId => {
      // Start loading the child nodes even before we
      // try to render the expanded node.
      // Note that we DO NOT wait for this to complete!
      renderableChildNodesCache.readAsync(replayClient, pauseId, nodeId);
    });

    dispatch(expandMultipleNodes(ancestorIds));

    if (shouldScrollIntoView) {
      dispatch(updateScrollIntoViewNode(latestSelectedNodeId));
    }
  };
}

export function selectNode(nodeId: string, reason?: SelectionReason): UIThunkAction {
  return async (dispatch, getState, { ThreadFront, replayClient, protocolClient }) => {
    // Ensure we have the data loaded
    const originalPauseId = await ThreadFront.getCurrentPauseId(replayClient);
    const nodes = await nodeDataCache.readAsync(replayClient, originalPauseId, {
      type: "parentNodes",
      nodeId,
    });

    // We cached all the plain object data for the ancestors,
    // but we really need the parsed data.  Preload that.
    await ancestorNodesCache.readAsync(replayClient, originalPauseId, nodeId);

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
function getLastNodeId(
  state: UIState,
  replayClient: ReplayClientInterface,
  pauseId: string,
  nodeId: string
) {
  // Keep recursing through nested children as long as possible
  while (true) {
    const nodeInfo = processedNodeDataCache.getValueIfCached(replayClient, pauseId, nodeId);
    const isExpanded = getIsNodeExpanded(state, nodeId);
    // If it's not expanded, stop here
    if (!isExpanded || !nodeInfo) {
      return nodeId;
    }
    const renderableChildren = renderableChildNodesCache.getValueIfCached(
      replayClient,
      pauseId,
      nodeId
    );
    const renderableChildIds = getCurrentRenderableChildNodeIds(
      replayClient,
      pauseId,
      nodeInfo,
      renderableChildren
    );

    // If there's no children, we're at a stopping point
    if (renderableChildIds.length === 0) {
      return nodeId;
    }
    // Otherwise, use the last child
    const lastChild = renderableChildIds[renderableChildIds.length - 1];
    nodeId = lastChild;
  }
}

function getParentNodeId(replayClient: ReplayClientInterface, pauseId: string, nodeId: string) {
  const nodeInfo = processedNodeDataCache.getValueIfCached(replayClient, pauseId, nodeId);
  return nodeInfo?.parentNodeId;
}

/**
 * Find the node that is displayed in the markup tree
 * immediately before the specified node and return its ID.
 */
function getPreviousNodeId(
  state: UIState,
  replayClient: ReplayClientInterface,
  pauseId: string,
  nodeId: string
) {
  const parentNodeId = getParentNodeId(replayClient, pauseId, nodeId);
  if (!parentNodeId) {
    return nodeId;
  }
  const parentNodeInfo = processedNodeDataCache.getValueIfCached(
    replayClient,
    pauseId,
    parentNodeId
  );
  assert(parentNodeInfo, "parent node not found in cache");
  if (parentNodeInfo.type === NodeConstants.DOCUMENT_TYPE_NODE) {
    return nodeId;
  }
  const renderableChildren = renderableChildNodesCache.getValueIfCached(
    replayClient,
    pauseId,
    parentNodeId
  );

  const renderableChildIds = getCurrentRenderableChildNodeIds(
    replayClient,
    pauseId,
    parentNodeInfo,
    renderableChildren
  );

  if (renderableChildIds.length === 0) {
    return nodeId;
  }
  const index = renderableChildIds.indexOf(nodeId);
  if (index >= 1) {
    return getLastNodeId(state, replayClient, pauseId, renderableChildIds[index - 1]);
  }
  return parentNodeId;
}

/**
 * Find the node that is displayed in the markup tree
 * immediately after the specified node and return its ID.
 */
function getNextNodeId(
  state: UIState,
  replayClient: ReplayClientInterface,
  pauseId: string,
  nodeId: string
) {
  if (getIsNodeExpanded(state, nodeId)) {
    const nodeInfo = processedNodeDataCache.getValueIfCached(replayClient, pauseId, nodeId);

    if (nodeInfo && nodeInfo.children.length > 0) {
      const renderableChildren = renderableChildNodesCache.getValueIfCached(
        replayClient,
        pauseId,
        nodeId
      );

      const renderableChildIds = getCurrentRenderableChildNodeIds(
        replayClient,
        pauseId,
        nodeInfo,
        renderableChildren
      );

      const firstChildId = renderableChildIds[0];
      if (firstChildId) {
        return firstChildId;
      }
    }
  }

  let currentNodeId = nodeId;
  let parentNodeId = getParentNodeId(replayClient, pauseId, currentNodeId);
  while (parentNodeId) {
    const parentNode = processedNodeDataCache.getValueIfCached(
      replayClient,
      pauseId,
      parentNodeId
    )!;
    const renderableChildren = renderableChildNodesCache.getValueIfCached(
      replayClient,
      pauseId,
      parentNodeId
    );

    const siblingIds = getCurrentRenderableChildNodeIds(
      replayClient,
      pauseId,
      parentNode,
      renderableChildren
    );

    // assert(siblings, "sibling nodes not found in cache");
    // const siblingIds = siblings.map(node => node.id);
    const index = siblingIds.indexOf(currentNodeId);
    assert(index >= 0, "current node not found among siblings");
    if (index + 1 < siblingIds.length) {
      return siblingIds[index + 1];
    }
    currentNodeId = parentNodeId;
    parentNodeId = getParentNodeId(replayClient, pauseId, currentNodeId);
  }

  return nodeId;
}

export type ElementsTreeKeyboardKeys = "Up" | "Down" | "Left" | "Right" | "PageUp" | "PageDown";

export function onElementsTreeKeyboardNavigation(key: ElementsTreeKeyboardKeys): UIThunkAction {
  return (dispatch, getState, { replayClient, ThreadFront }) => {
    const state = getState();
    const selectedNodeId = getSelectedNodeId(state);
    const pauseId = ThreadFront.currentPauseIdUnsafe;
    if (selectedNodeId == null || !pauseId) {
      return;
    }

    let nodeIdToSelect: string | null = null;

    switch (key) {
      case "Up": {
        // Always find the node row directly above this one,
        // even if it's deeply nested
        nodeIdToSelect = getPreviousNodeId(state, replayClient, pauseId, selectedNodeId);
        break;
      }
      case "Down": {
        // ALways find the node row directly below this one
        nodeIdToSelect = getNextNodeId(state, replayClient, pauseId, selectedNodeId);
        break;
      }
      case "Left": {
        // If the node is expanded, toggle it closed
        if (getIsNodeExpanded(state, selectedNodeId)) {
          dispatch(updateNodeExpanded({ nodeId: selectedNodeId, isExpanded: false }));
        } else {
          // Otherwise, try to select the parent node
          const parentNodeId = getParentNodeId(replayClient, pauseId, selectedNodeId);
          if (parentNodeId != null) {
            const parentNodeInfo = processedNodeDataCache.getValueIfCached(
              replayClient,
              pauseId,
              parentNodeId
            );
            if (parentNodeInfo && parentNodeInfo.type !== NodeConstants.DOCUMENT_TYPE_NODE) {
              nodeIdToSelect = parentNodeId;
            }
          }
        }
        break;
      }
      case "Right": {
        const selectedNodeInfo = processedNodeDataCache.getValueIfCached(
          replayClient,
          pauseId,
          selectedNodeId
        );
        const isExpanded = getIsNodeExpanded(state, selectedNodeId);
        assert(selectedNodeInfo, "selected node not found in markup state");

        // If the node is _not_ expanded, open it
        if (!isExpanded || selectedNodeInfo.isLoadingChildren) {
          dispatch(expandNode(selectedNodeId, true));
        } else {
          // Otherwise, try to select the first child (equivalent to "Down")
          const renderableChildren = renderableChildNodesCache.getValueIfCached(
            replayClient,
            pauseId,
            selectedNodeId
          );
          const renderableChildIds = getCurrentRenderableChildNodeIds(
            replayClient,
            pauseId,
            selectedNodeInfo,
            renderableChildren
          );
          const firstChildId = renderableChildIds?.[0];
          if (firstChildId != null) {
            dispatch(selectNode(firstChildId, "keyboard"));
            return;
          }
          // If there weren't any children, find the next row
          const nextNodeId = getNextNodeId(state, replayClient, pauseId, selectedNodeId);
          nodeIdToSelect = nextNodeId;
        }
        break;
      }

      case "PageUp": {
        // Go upwards up to 10 rows
        let previousNodeId = selectedNodeId;
        for (let i = 0; i < 10; i++) {
          previousNodeId = getPreviousNodeId(state, replayClient, pauseId, previousNodeId);
        }
        nodeIdToSelect = previousNodeId;
        break;
      }
      case "PageDown": {
        // Go down up to 10 rows
        let nextNodeId: string | undefined = selectedNodeId;
        for (let i = 0; i < 10; i++) {
          nextNodeId = getNextNodeId(state, replayClient, pauseId, nextNodeId);
        }
        nodeIdToSelect = nextNodeId;
        break;
      }
    }

    if (nodeIdToSelect !== null) {
      dispatch(selectNode(nodeIdToSelect, "keyboard"));
    }
  };
}

let unhighlightTimer: ReturnType<typeof window.setTimeout> | null = null;

export function highlightNodes(
  nodeIds: string[],
  pauseId?: string,
  duration?: number
): UIThunkAction {
  return async (dispatch, getState, { ThreadFront, protocolClient, replayClient }) => {
    const recordingCapabilities = await recordingCapabilitiesCache.readAsync(replayClient);
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
          const boxModel = await boxModelCache.readAsync(replayClient, pauseId!, nodeId);
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
    const { highlightedNodes } = getState().markup;
    if (highlightedNodes && highlightedNodes.length > 0) {
      dispatch(nodeHighlightingCleared());
    }
  };
}

export const searchDOM = (query: string): UIThunkAction<Promise<ProtocolObject[]>> => {
  return async (dispatch, getState, { ThreadFront, replayClient, protocolClient }) => {
    const state = getState();
    const pauseIdBefore = state.pause.id;
    const sessionId = state.app.sessionId;
    if (!sessionId || !pauseIdBefore) {
      return [];
    }

    const results = await nodeDataCache.readAsync(replayClient, pauseIdBefore, {
      type: "searchDOM",
      query,
    });

    return results;
  };
};

export const getNodeBoundingRect = (
  nodeId: string
): UIThunkAction<Promise<DOMRect | undefined>> => {
  return async (dispatch, getState, { replayClient }) => {
    const state = getState();
    const pauseId = state.pause.id;
    const sessionId = state.app.sessionId;

    return boundingRectCache.readAsync(replayClient, pauseId!, nodeId);
  };
};
