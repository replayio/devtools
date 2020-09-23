const { createEnum } = require("devtools/client/shared/enum");

createEnum(
  [
    // Updates the expanded state for a given node.
    "UPDATE_NODE_EXPANDED",

    // Updates the root node of the markup tree.
    "UPDATE_ROOT_NODE",

    // Updates the selected node to display in the markup tree.
    "UPDATE_SELECTED_NODE",

    // Updates the markup tree.
    "UPDATE_TREE",
  ],
  module.exports
);
