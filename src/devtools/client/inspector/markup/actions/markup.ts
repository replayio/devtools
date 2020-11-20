import { Action } from "redux";
import { assert } from "protocol/utils";
import { ThreadFront } from "protocol/thread";
import { NodeFront } from "protocol/thread/node";
import Selection from "devtools/client/framework/selection";
import { NodeInfo } from "../state/markup";
import { UIThunkAction } from "ui/actions";
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
export function newRoot(rootNodeFront: NodeFront): NewRootAction {
  return {
    type: "NEW_ROOT",
    rootNode: convertNode(rootNodeFront),
  };
}

/**
 * Adds the children of a node to the tree and updates the parent's `children` property.
 */
export function addChildren(parentFront: NodeFront, childFronts: NodeFront[]): AddChildrenAction {
  return {
    type: "ADD_CHILDREN",
    parentNodeId: parentFront.objectId(),
    children: childFronts.map(node => convertNode(node)),
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
      dispatch(addChildren(nodeFront, childNodes));
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

    await selectedNode.ensureParentsLoaded();
    if (selection.nodeFront !== selectedNode) return;

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

/**
 * Given a NodeFront, return the representation for the markup tree.
 *
 * @param  {NodeFront} node
 *         The NodeFront of the node to add to the markup tree.
 * @param  {Boolean} isExpanded
 *         Whether or not the node is expanded.
 */
function convertNode(node: NodeFront, { isExpanded = false } = {}): NodeInfo {
  const parentNode = node.parentNode();
  const id = node.objectId();

  return {
    attributes: node.attributes,
    children: [],
    displayName: node.nodeType === DOCUMENT_TYPE_NODE ? node.doctypeString : node.displayName,
    displayType: node.displayType,
    hasChildren: !!node.hasChildren,
    hasEventListeners: node.hasEventListeners,
    id,
    isDisplayed: node.isDisplayed,
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
