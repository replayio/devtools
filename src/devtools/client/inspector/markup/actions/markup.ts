import { Action } from "redux";
import { assert } from "protocol/utils";
import { ThreadFront } from "protocol/thread";
import { NodeFront } from "protocol/thread/node";
import Selection from "devtools/client/framework/selection";
import { NodeInfo } from "../state/markup";
import { UIThunkAction } from "ui/actions";
import {
  getNodeInfo,
  getParentNodeId,
  getSelectedNodeId,
  isNodeExpanded,
} from "../selectors/markup";
import { UIState } from "ui/state";
import Highlighter from "highlighter/highlighter";
const { DOCUMENT_TYPE_NODE } = require("devtools/shared/dom-node-constants");

export type ResetAction = Action<"RESET">;
export type NewRootAction = Action<"NEW_ROOT"> & { rootNode: NodeInfo };
export type AddChildrenAction = Action<"ADD_CHILDREN"> & {
  parentNodeId: string;
  children: NodeInfo[];
};
export type UpdateNodeExpandedAction = Action<"UPDATE_NODE_EXPANDED"> & {
  nodeId: string;
  isExpanded: boolean;
};
export type UpdateSelectedNodeAction = Action<"UPDATE_SELECTED_NODE"> & {
  selectedNode: string | null;
};
export type UpdateScrollIntoViewNodeAction = Action<"UPDATE_SCROLL_INTO_VIEW_NODE"> & {
  scrollIntoViewNode: string;
};
export type MarkupAction =
  | ResetAction
  | NewRootAction
  | AddChildrenAction
  | UpdateNodeExpandedAction
  | UpdateSelectedNodeAction
  | UpdateScrollIntoViewNodeAction;

/**
 * Clears the tree
 */
export function reset(): ResetAction {
  return {
    type: "RESET",
  };
}

/**
 * Clears the tree and adds the new root node.
 */
export function newRoot(rootNodeFront: NodeFront): UIThunkAction {
  return async ({ dispatch }) => {
    dispatch({
      type: "NEW_ROOT",
      rootNode: await convertNode(rootNodeFront),
    });
  };
}

/**
 * Adds the children of a node to the tree and updates the parent's `children` property.
 */
export function addChildren(parentFront: NodeFront, childFronts: NodeFront[]): UIThunkAction {
  return async ({ dispatch }) => {
    dispatch({
      type: "ADD_CHILDREN",
      parentNodeId: parentFront.objectId(),
      children: await Promise.all(childFronts.map(node => convertNode(node))),
    });
  };
}

/**
 * Updates the expanded state for a given node. If isExpanded is true,
 * all child nodes must already be in the tree. Use expandNode() otherwise.
 */
export function updateNodeExpanded(nodeId: string, isExpanded: boolean): UpdateNodeExpandedAction {
  return {
    type: "UPDATE_NODE_EXPANDED",
    nodeId,
    isExpanded,
  };
}

/**
 * Updates the selected node to display in the markup tree.
 */
export function updateSelectedNode(selectedNode: string | null): UpdateSelectedNodeAction {
  return {
    type: "UPDATE_SELECTED_NODE",
    selectedNode,
  };
}

/**
 * Set the node that should be scrolled into view
 */
export function scrollIntoView(scrollIntoViewNode: string): UpdateScrollIntoViewNodeAction {
  return {
    type: "UPDATE_SCROLL_INTO_VIEW_NODE",
    scrollIntoViewNode,
  };
}

/**
 * Expand the given node after ensuring its child nodes are loaded and added to the tree.
 * If shouldScrollIntoView is true, the node is scrolled into view if its children need to be loaded.
 */
export function expandNode(nodeId: string, shouldScrollIntoView = false): UIThunkAction {
  return async ({ dispatch, getState }) => {
    const tree = getState().markup.tree;
    const node = tree[nodeId];
    assert(node);

    if (node.isExpanded) {
      return;
    }

    if (node.hasChildren && node.children.length === 0) {
      if (shouldScrollIntoView) {
        dispatch(scrollIntoView(node.id));
      }

      const pause = ThreadFront.currentPause;
      assert(pause);
      const nodeFront = pause.getNodeFront(nodeId);
      const childNodes = await nodeFront.childNodes();
      if (ThreadFront.currentPause !== pause) return;
      await dispatch(addChildren(nodeFront, childNodes));
    }

    dispatch(updateNodeExpanded(nodeId, true));
  };
}

/**
 * Update the tree to show the currently selected node.
 * If shouldScrollIntoView is true, the selected node is scrolled into view. If any of its
 * ancestors' children haven't been loaded yet, those ancestors will also be scrolled into view
 * while their children are loaded.
 */
export function selectionChanged(
  selection: Selection,
  expandSelectedNode: boolean,
  shouldScrollIntoView = false
): UIThunkAction {
  return async ({ dispatch }) => {
    const selectedNode = selection.nodeFront;
    if (!selectedNode) {
      dispatch(updateSelectedNode(null));
      return;
    }

    dispatch(updateSelectedNode(selectedNode.objectId()));

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
      if (selection.nodeFront !== selectedNode) return;
    }

    if (shouldScrollIntoView) {
      dispatch(scrollIntoView(selectedNode.objectId()));
    }
  };
}

export function selectNode(nodeId: string, reason?: string): UIThunkAction {
  return ({ toolbox }) => {
    const nodeFront = ThreadFront.currentPause?.getNodeFront(nodeId);
    if (nodeFront) {
      Highlighter.highlight(nodeFront, 1000);
      toolbox.selection.setNodeFront(nodeFront, { reason });
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
  assert(parentNodeInfo);
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
    assert(siblingIds);
    const index = siblingIds.indexOf(currentNodeId);
    assert(index >= 0);
    if (index + 1 < siblingIds.length) {
      return siblingIds[index + 1];
    }
    currentNodeId = parentNodeId;
    parentNodeId = getParentNodeId(state, currentNodeId);
  }

  return nodeId;
}

export function onLeftKey(): UIThunkAction {
  return ({ getState, dispatch }) => {
    const state = getState();
    const selectedNodeId = getSelectedNodeId(state);
    if (selectedNodeId == null) {
      return;
    }

    if (isNodeExpanded(state, selectedNodeId)) {
      dispatch(updateNodeExpanded(selectedNodeId, false));
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
  return ({ getState, dispatch }) => {
    const state = getState();
    const selectedNodeId = getSelectedNodeId(state);
    if (selectedNodeId == null) {
      return;
    }

    const selectedNodeInfo = getNodeInfo(state, selectedNodeId);
    assert(selectedNodeInfo);
    if (!selectedNodeInfo.isExpanded) {
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
  return ({ getState, dispatch }) => {
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
  return ({ getState, dispatch }) => {
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
  return ({ getState, dispatch }) => {
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
  return ({ getState, dispatch }) => {
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

/**
 * Given a NodeFront, return the representation for the markup tree.
 *
 * @param  {NodeFront} node
 *         The NodeFront of the node to add to the markup tree.
 * @param  {Boolean} isExpanded
 *         Whether or not the node is expanded.
 */
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
  };
}
