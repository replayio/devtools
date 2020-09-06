const Services = require("Services");
const {
  UPDATE_NODE_EXPANDED,
  UPDATE_ROOT_NODE,
  UPDATE_SELECTED_NODE,
  UPDATE_TREE,
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
  // The markup tree representation of the DOM view.
  tree: {},
};

const reducers = {
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

  [UPDATE_ROOT_NODE](markup, { rootNode }) {
    return {
      ...markup,
      rootNode,
    };
  },

  [UPDATE_SELECTED_NODE](markup, { selectedNode }) {
    return {
      ...markup,
      selectedNode,
    };
  },

  [UPDATE_TREE](markup, { tree }) {
    return {
      ...markup,
      tree,
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
