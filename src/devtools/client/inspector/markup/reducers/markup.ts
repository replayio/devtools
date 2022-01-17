import { assert } from "protocol/utils";
import { createReducer, ReducerObject } from "../../shared/reducer-object";
import { MarkupAction } from "../actions/markup";
import { MarkupState, MarkupTree } from "../state/markup";
const Services = require("devtools/shared/services");

const ATTR_COLLAPSE_ENABLED_PREF = "devtools.markup.collapseAttributes";
const ATTR_COLLAPSE_LENGTH_PREF = "devtools.markup.collapseAttributeLength";

const INITIAL_MARKUP: MarkupState = {
  collapseAttributes: Services.prefs.getBoolPref(ATTR_COLLAPSE_ENABLED_PREF),
  collapseAttributeLength: Services.prefs.getIntPref(ATTR_COLLAPSE_LENGTH_PREF),
  rootNode: null,
  selectedNode: null,
  scrollIntoViewNode: null,
  tree: {},
};

const reducers: ReducerObject<MarkupState, MarkupAction> = {
  ["RESET"]() {
    return { ...INITIAL_MARKUP };
  },

  ["NEW_ROOT"](markup, { rootNode }) {
    return {
      ...markup,
      tree: {
        [rootNode.id]: rootNode,
      },
      rootNode: rootNode.id,
      selectedNode: null,
      scrollIntoViewNode: null,
    };
  },

  ["ADD_CHILDREN"](markup, { parentNodeId, children }) {
    const parentNodeInfo = markup.tree[parentNodeId];
    assert(parentNodeInfo);

    const newNodes: MarkupTree = {};
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
            ...parentNodeInfo,
            children: children.map(child => child.id),
          },
        },
      };
    } else {
      return markup;
    }
  },

  ["UPDATE_NODE_EXPANDED"](markup, { nodeId, isExpanded }) {
    const nodeInfo = markup.tree[nodeId];
    assert(nodeInfo);

    return {
      ...markup,
      tree: {
        ...markup.tree,
        [nodeId]: {
          ...nodeInfo,
          isExpanded,
        },
      },
    };
  },

  ["UPDATE_CHILDREN_LOADING"](markup, { nodeId, isLoadingChildren }) {
    const nodeInfo = markup.tree[nodeId];
    assert(nodeInfo);

    return {
      ...markup,
      tree: {
        ...markup.tree,
        [nodeId]: {
          ...nodeInfo,
          isLoadingChildren,
        },
      },
    };
  },

  ["UPDATE_SELECTED_NODE"](markup, { selectedNode }) {
    return {
      ...markup,
      selectedNode,
    };
  },

  ["UPDATE_SCROLL_INTO_VIEW_NODE"](markup, { scrollIntoViewNode }) {
    return {
      ...markup,
      scrollIntoViewNode,
    };
  },
};

export default createReducer(INITIAL_MARKUP, reducers);
