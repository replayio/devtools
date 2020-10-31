import { assert } from "protocol/utils";
import { ThreadFront } from "protocol/thread";
import { DOCUMENT_TYPE_NODE } from "devtools/shared/dom-node-constants";
import { NEW_ROOT, ADD_CHILDREN, UPDATE_NODE_EXPANDED, UPDATE_SELECTED_NODE } from "./index";

/**
 * Clears the tree and adds the new root node.
 */
export function newRoot(rootNodeFront) {
  return {
    type: NEW_ROOT,
    rootNode: convertNode(rootNodeFront),
  };
}

/**
 * Adds the children of a node to the tree and updates the parent's `children` property.
 */
export function addChildren(parentFront, childFronts) {
  return {
    type: ADD_CHILDREN,
    parentNodeId: parentFront.objectId(),
    children: childFronts.map(convertNode),
  };
}

/**
 * Updates the expanded state for a given node. If isExpanded is true,
 * all child nodes must already be in the tree. Use expandNode() otherwise.
 */
export function updateNodeExpanded(nodeId, isExpanded) {
  return {
    type: UPDATE_NODE_EXPANDED,
    nodeId,
    isExpanded,
  };
}

/**
 * Updates the selected node to display in the markup tree.
 */
export function updateSelectedNode(selectedNode) {
  return {
    type: UPDATE_SELECTED_NODE,
    selectedNode,
  };
}

/**
 * Expand the given node after ensuring its child nodes are loaded and added to the tree.
 */
export function expandNode(nodeId) {
  return async ({ dispatch, getState }) => {
    const tree = getState().markup.tree;
    const node = tree[nodeId];
    assert(node);

    if (node.hasChildren && node.children.length === 0) {
      const pause = ThreadFront.currentPause;
      const node = pause.getNodeFront(nodeId);
      const childNodes = await node.childNodes();
      if (ThreadFront.currentPause !== pause) return;
      dispatch(addChildren(node, childNodes));
    }

    dispatch(updateNodeExpanded(nodeId, true));
  };
}

/**
 * Update the tree to show the currently selected node.
 */
export function selectionChanged(selection, expandSelectedNode) {
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
      await dispatch(expandNode(ancestor.objectId()));
      if (selection.nodeFront !== selectedNode) return;
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
function convertNode(node, { isExpanded = false } = {}) {
  const parentNode = node.parentNode();
  const id = node.objectId();

  return {
    // A list of the node's attributes.
    attributes: node.attributes,
    // Array of child node object ids.
    children: [],
    // The display name for the UI. This is either the lower casee of the node's tag
    // name or the doctype string for a document type node.
    displayName: node.nodeType === DOCUMENT_TYPE_NODE ? node.doctypeString : node.displayName,
    // The computed display style property value of the node.
    displayType: node.displayType,
    // Whether or not the node has child nodes.
    hasChildren: node.hasChildren,
    // Whether or not the node has event listeners.
    hasEventListeners: node.hasEventListeners,
    // An unique NodeFront object id.
    id,
    // Whether or not the node is displayed. If a node has the attribute
    // `display: none`, it is not displayed (faded in the markup view).
    isDisplayed: node.isDisplayed,
    // Whether or not the node is expanded.
    isExpanded,
    // Whether or not the node is an inline text child. NYI
    isInlineTextChild: !!node.inlineTextChild,
    // Whether or not the node is scrollable. NYI
    isScrollable: node.isScrollable,
    // The namespace URI of the node. NYI
    namespaceURI: node.namespaceURI,
    // The object id of the parent node.
    parentNodeId: parentNode?.objectId(),
    // The pseudo element type.
    pseudoType: node.pseudoType,
    // The name of the current node.
    tagName: node.tagName,
    // The node's `nodeType` which identifies what the node is.
    type: node.nodeType,
    // The node's `nodeValue` which identifies the value of the current node.
    value: node.getNodeValue(),
  };
}
