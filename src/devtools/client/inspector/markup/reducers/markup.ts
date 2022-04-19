import { assert } from "protocol/utils";

import { createReducer, ReducerObject } from "../../shared/reducer-object";
import { MarkupAction } from "../actions/markup";
import { MarkupState, MarkupTree } from "../state/markup";

const Services = require("devtools/shared/services");

const ATTR_COLLAPSE_ENABLED_PREF = "devtools.markup.collapseAttributes";
const ATTR_COLLAPSE_LENGTH_PREF = "devtools.markup.collapseAttributeLength";

const INITIAL_MARKUP: MarkupState = {
  collapseAttributeLength: Services.prefs.getIntPref(ATTR_COLLAPSE_LENGTH_PREF),
  collapseAttributes: Services.prefs.getBoolPref(ATTR_COLLAPSE_ENABLED_PREF),
  rootNode: null,
  scrollIntoViewNode: null,
  selectedNode: null,
  tree: {},
};

const reducers: ReducerObject<MarkupState, MarkupAction> = {
  ["ADD_CHILDREN"](markup, { parentNodeId, children }) {
    const parentNodeInfo = markup.tree[parentNodeId];
    assert(parentNodeInfo, "parent node not found in markup state");

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

  ["NEW_ROOT"](markup, { rootNode }) {
    return {
      ...markup,
      rootNode: rootNode.id,
      scrollIntoViewNode: null,
      selectedNode: null,
      tree: {
        [rootNode.id]: rootNode,
      },
    };
  },

  ["RESET"]() {
    return { ...INITIAL_MARKUP };
  },

  ["UPDATE_CHILDREN_LOADING"](markup, { nodeId, isLoadingChildren }) {
    const nodeInfo = markup.tree[nodeId];
    assert(nodeInfo, "node not found in markup state");

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

  ["UPDATE_NODE_EXPANDED"](markup, { nodeId, isExpanded }) {
    const nodeInfo = markup.tree[nodeId];
    assert(nodeInfo, "node not found in markup state");

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

  ["UPDATE_SCROLL_INTO_VIEW_NODE"](markup, { scrollIntoViewNode }) {
    return {
      ...markup,
      scrollIntoViewNode,
    };
  },

  ["UPDATE_SELECTED_NODE"](markup, { selectedNode }) {
    return {
      ...markup,
      selectedNode,
    };
  },
};

export default createReducer(INITIAL_MARKUP, reducers);
