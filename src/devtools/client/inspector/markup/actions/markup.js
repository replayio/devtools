const {
  ADD_NODE,
  UPDATE_CHILDREN,
  UPDATE_NODE_EXPANDED,
  UPDATE_ROOT_NODE,
  UPDATE_SELECTED_NODE,
  UPDATE_TREE,
} = require("./index");

module.exports = {
  /**
   * Adds a node to the tree.
   */
  addNode(node) {
    return {
      type: ADD_NODE,
      node,
    };
  },

  /**
   * Updates the children of a node.
   */
  updateChildren(parentNodeId, childNodeIds) {
    return {
      type: UPDATE_CHILDREN,
      parentNodeId,
      childNodeIds,
    };
  },

  /**
   * Updates the expanded state for a given node.
   *
   * @param {String} nodeId
   *        The NodeFront object id.
   * @param {Boolean} isExpanded
   *        Whether or not the node is expanded.
   */
  updateNodeExpanded(nodeId, isExpanded) {
    return {
      type: UPDATE_NODE_EXPANDED,
      nodeId,
      isExpanded,
    };
  },

  /**
   * Updates the root node of the markup tree.
   *
   * @param {String} rootNode
   *        The NodeFront object id of the new root node.
   */
  updateRootNode(rootNode) {
    return {
      type: UPDATE_ROOT_NODE,
      rootNode,
    };
  },

  /**
   * Updates the selected node to display in the markup tree.
   *
   * @param {String} selectedNode
   *        The NodeFront object id of the selected node.
   */
  updateSelectedNode(selectedNode) {
    return {
      type: UPDATE_SELECTED_NODE,
      selectedNode,
    };
  },

  /**
   * Updates the markup tree.
   *
   * @param {Objcet} tree
   *        An object representing the markup tree.
   */
  updateTree(tree) {
    return {
      type: UPDATE_TREE,
      tree,
    };
  },
};
