const { createEnum } = require("devtools/client/shared/enum");

createEnum(
  [
    // Clears the tree.
    "RESET",

    // Clears the tree and adds a new root node.
    "NEW_ROOT",

    // Adds the children of a node to the tree and updates the parent's `children` property.
    "ADD_CHILDREN",

    // Updates the expanded state for a given node.
    "UPDATE_NODE_EXPANDED",

    // Updates the selected node to display in the markup tree.
    "UPDATE_SELECTED_NODE",
  ],
  module.exports
);
