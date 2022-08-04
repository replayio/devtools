import { assert, defer, Deferred } from "protocol/utils";
import type { NodeFront } from "protocol/thread/node";
import { SelectionReason } from "devtools/client/framework/selection";
import { selection } from "devtools/client/framework/selection";

import { UIState } from "ui/state";
import { AppStartListening } from "ui/setup/listenerMiddleware";
import { isInspectorSelected } from "ui/reducers/app";
import type { UIStore, UIThunkAction } from "ui/actions";

import {
  resetMarkup,
  childrenAdded,
  newRootAdded,
  nodeSelected,
  updateChildrenLoading,
  updateNodeExpanded,
  updateScrollIntoViewNode,
  NodeInfo,
} from "../reducers/markup";

import {
  getNodeInfo,
  getParentNodeId,
  getSelectedNodeId,
  isNodeExpanded,
} from "../selectors/markup";

import Highlighter from "highlighter/highlighter";
import { DOCUMENT_TYPE_NODE, TEXT_NODE } from "devtools/shared/dom-node-constants";
import { features } from "devtools/client/inspector/prefs";

let rootNodeWaiter: Deferred<void> | undefined;

export function setupMarkup(store: UIStore, startAppListening: AppStartListening) {
  // Any time a new node is selected in the "Markup" panel, check to see if the "Elements" panel is
  // actually visible. If so, update our selection in Redux, including expanding ancestor nodes.
  selection.on("new-node-front", (nodeFront: NodeFront, reason: string) => {
    if (!isInspectorSelected(store.getState()) || !selection.isNode()) {
      return;
    }

    store.dispatch(selectionChanged(reason === "navigateaway", reason !== "markup"));
  });

  // Any time the app is paused, clear out all fetched DOM nodes, and reload the "Markup" panel.
  startAppListening({
    type: "PAUSED",
    effect: async (action, listenerApi) => {
      const { condition, dispatch, getState, cancelActiveListeners, extra } = listenerApi;
      const { ThreadFront } = extra;

      cancelActiveListeners();

      // every time we pause, clear the existing DOM node info
      dispatch(reset());

      async function loadNewDocument() {
        await ThreadFront.ensureAllSources();

        // Clear selection if pauses have differed
        const pause = ThreadFront.getCurrentPause();
        if (selection.nodeFront && selection.nodeFront.pause !== pause) {
          selection.setNodeFront(null);
        }

        await dispatch(newRoot());
        if (ThreadFront.currentPause !== pause) {
          return;
        }

        if (selection.nodeFront) {
          dispatch(selectionChanged(false));
        } else {
          const rootNode = await ThreadFront.getRootDOMNode();

          if (!rootNode) {
            return;
          }

          const defaultNode = await rootNode.querySelector("body");
          if (defaultNode && !selection.nodeFront && ThreadFront.currentPause === pause) {
            selection.setNodeFront(defaultNode, { reason: "navigateaway" });
          }
        }
      }

      // If the "Elements" panel is already selected, go ahead and fetch markup data now.
      // Otherwise, wait until the next time it _is_ selected.
      if (isInspectorSelected(getState())) {
        await loadNewDocument();
      } else {
        await condition((action, currState) => {
          return isInspectorSelected(currState);
        });
        await loadNewDocument();
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
  return async (dispatch, getState, { ThreadFront }) => {
    const pause = ThreadFront.currentPause;
    assert(pause, "no current pause");
    const rootNodeFront = await ThreadFront.getRootDOMNode();
    if (!rootNodeFront || ThreadFront.currentPause !== pause) {
      return;
    }
    const rootNode = await convertNode(rootNodeFront);
    if (ThreadFront.currentPause !== pause) {
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
  parentFront: NodeFront,
  childFronts: NodeFront[]
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { ThreadFront }) => {
    if (!features.showWhitespaceNodes) {
      childFronts = childFronts.filter(
        node => node.nodeType !== TEXT_NODE || /[^\s]/.exec(node.getNodeValue()!)
      );
    }

    const children = await Promise.all(childFronts.map(node => convertNode(node)));
    if (ThreadFront.currentPause !== parentFront.pause) {
      return;
    }

    dispatch(childrenAdded({ parentNodeId: parentFront.objectId(), children }));
  };
}

export function collapseNode(nodeId: string) {
  return updateNodeExpanded({ nodeId, isExpanded: false });
}

export function toggleNodeExpanded(nodeId: string, isExpanded: boolean): UIThunkAction {
  return (dispatch, getState, { ThreadFront }) => {
    assert(ThreadFront.currentPause, "no current pause");

    if (isExpanded) {
      dispatch(collapseNode(nodeId));
    } else {
      dispatch(expandNode(nodeId));
    }

    selection.setNodeFront(ThreadFront.currentPause.getNodeFront(nodeId));
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
  return async (dispatch, getState, { ThreadFront }) => {
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

      const pause = ThreadFront.currentPause;
      assert(pause, "no current pause");
      const nodeFront = pause.getNodeFront(nodeId);
      const childNodes = await nodeFront.childNodes();
      if (ThreadFront.currentPause !== pause) {
        return;
      }
      await dispatch(addChildren(nodeFront, childNodes));
      if (ThreadFront.currentPause !== pause) {
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
): UIThunkAction {
  return async (dispatch, getState) => {
    const selectedNode = selection.nodeFront;

    if (!selectedNode) {
      dispatch(nodeSelected(null));
      return;
    }

    if (rootNodeWaiter) {
      await rootNodeWaiter.promise;
    }
    if (selection.nodeFront !== selectedNode) {
      return;
    }

    dispatch(nodeSelected(selectedNode.objectId()));

    // collect the selected node's ancestors in top-down order
    let ancestors = [];
    let ancestor = expandSelectedNode ? selectedNode : selectedNode.parentNode();
    while (ancestor) {
      ancestors.unshift(ancestor);
      ancestor = ancestor.parentNode();
    }

    // expand each ancestor, loading its children if necessary
    for (const ancestor of ancestors) {
      await dispatch(expandNode(ancestor.objectId(), shouldScrollIntoView));
      if (selection.nodeFront !== selectedNode) {
        return;
      }
    }

    if (shouldScrollIntoView) {
      dispatch(updateScrollIntoViewNode(selectedNode.objectId()));
    }
  };
}

export function selectNode(nodeId: string, reason?: SelectionReason): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    const nodeFront = ThreadFront.currentPause?.getNodeFront(nodeId);
    if (nodeFront) {
      Highlighter.highlight(nodeFront, 1000);
      // HACK This is ugly, but we lazy-load the component and also try to use `window.gInspector` in places.
      // So, ensure it's loaded, _then_ use this global
      await import("devtools/client/inspector/components/App");
      window.gInspector.selection.setNodeFront(nodeFront, { reason });
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
  if (parentNodeInfo.type === DOCUMENT_TYPE_NODE) {
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
        if (parentNodeInfo && parentNodeInfo.type !== DOCUMENT_TYPE_NODE) {
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

// This doesn't even need to be in Redux
let hoveredNodeId: string | null = null;

export function highlightNode(nodeId: string): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    if (hoveredNodeId !== nodeId) {
      hoveredNodeId = nodeId;
      Highlighter.highlight(ThreadFront.currentPause!.getNodeFront(nodeId));
    }
  };
}

export function unhighlightNode(nodeId: string): UIThunkAction {
  return async (dispatch, getState) => {
    if (hoveredNodeId && nodeId === hoveredNodeId) {
      hoveredNodeId = null;
      Highlighter.unhighlight();
    }
  };
}

async function convertNode(node: NodeFront, { isExpanded = false } = {}): Promise<NodeInfo> {
  const parentNode = node.parentNode();
  const id = node.objectId();

  return {
    attributes: node.attributes,
    children: [],
    displayName: node.nodeType === DOCUMENT_TYPE_NODE ? node.doctypeString : node.displayName,
    displayType: await node.getDisplayType(),
    hasChildren: !!node.hasChildren,
    hasEventListeners: await node.hasEventListeners(),
    id,
    isDisplayed: await node.isDisplayed(),
    isExpanded,
    isInlineTextChild: !!node.inlineTextChild,
    isScrollable: node.isScrollable,
    namespaceURI: node.namespaceURI,
    parentNodeId: parentNode?.objectId(),
    pseudoType: node.pseudoType,
    tagName: node.tagName,
    type: node.nodeType,
    value: node.getNodeValue(),
    isLoadingChildren: false,
  };
}
