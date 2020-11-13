const { assert } = require("protocol/utils");
const Services = require("Services");
const {
  RESET,
  NEW_ROOT,
  ADD_CHILDREN,
  UPDATE_NODE_EXPANDED,
  UPDATE_SELECTED_NODE,
} = require("../actions/index");

const ATTR_COLLAPSE_ENABLED_PREF = "devtools.markup.collapseAttributes";
const ATTR_COLLAPSE_LENGTH_PREF = "devtools.markup.collapseAttributeLength";

const INITIAL_MARKUP = {
  // Whether or not to collapse the attributes for nodes.
  collapseAttributes: Services.prefs.getBoolPref(ATTR_COLLAPSE_ENABLED_PREF),
  // The max length of the attribute value prior to truncating the attributes.
  collapseAttributeLength: Services.prefs.getIntPref(ATTR_COLLAPSE_LENGTH_PREF),
  // The root node to display in the DOM view.
  rootNode: null,
  // The selected node to display in the DOM view.
  selectedNode: null,
  // An object representing the markup tree. The key to the object represents the object
  // ID of a NodeFront of a given node. The value of each item in the object contains
  // an object representing the properties of the given node.
  tree: {},
};

const reducers = {
  [RESET]() {
    return { ...INITIAL_MARKUP };
  },

  [NEW_ROOT](markup, { rootNode }) {
    return {
      ...markup,
      tree: {
        [rootNode.id]: rootNode,
      },
      rootNode: rootNode.id,
    };
  },

  [ADD_CHILDREN](markup, { parentNodeId, children }) {
    assert(markup.tree[parentNodeId]);

    const newNodes = {};
    let hasNewNodes = false;
    for (const node of children) {
      if (!(node.id in markup.tree)) {
        newNodes[node.id] = node;
        hasNewNodes = true;
      }
    }

    if (hasNewNodes) {
      return {
        ...markup,
        tree: {
          ...markup.tree,
          ...newNodes,
          [parentNodeId]: {
            ...markup.tree[parentNodeId],
            children: children.map(child => child.id),
          },
        },
      };
    } else {
      return markup;
    }
  },

  [UPDATE_NODE_EXPANDED](markup, { nodeId, isExpanded }) {
    return {
      ...markup,
      tree: {
        ...markup.tree,
        [nodeId]: {
          ...markup.tree[nodeId],
          isExpanded,
        },
      },
    };
  },

  [UPDATE_SELECTED_NODE](markup, { selectedNode }) {
    return {
      ...markup,
      selectedNode,
    };
  },
};

module.exports = function (markup = INITIAL_MARKUP, action) {
  const reducer = reducers[action.type];
  if (!reducer) {
    return markup;
  }
  return reducer(markup, action);
};
