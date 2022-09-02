import { createSlice, createEntityAdapter, PayloadAction, EntityState } from "@reduxjs/toolkit";
import { BoxModel } from "@replayio/protocol";
// Side-effectful import - needed to initialize these prefs
import "devtools/client/inspector/prefs";
const Services = require("devtools/shared/services");

const ATTR_COLLAPSE_ENABLED_PREF = "devtools.markup.collapseAttributes";
const ATTR_COLLAPSE_LENGTH_PREF = "devtools.markup.collapseAttributeLength";

import { Attr } from "@replayio/protocol";
import { NodeFront } from "protocol/thread/node";
import { UIState } from "ui/state";

export interface NodeInfo {
  // A list of the node's attributes.
  attributes: Attr[];
  // Array of child node object ids.
  children: string[];
  // The display name for the UI. This is either the lower casee of the node's tag
  // name or the doctype string for a document type node.
  displayName: string;
  // The computed display style property value of the node.
  displayType: string | undefined;
  // Whether or not the node has child nodes.
  hasChildren: boolean;
  // Whether or not the node has event listeners.
  hasEventListeners: boolean;
  // An unique NodeFront object id.
  id: string;
  // Whether or not the node is displayed. If a node has the attribute
  // `display: none`, it is not displayed (faded in the markup view).
  isDisplayed: boolean;
  // Whether or not the node is expanded.
  isExpanded: boolean;
  // Whether or not the node is an inline text child. NYI
  isInlineTextChild: boolean;
  // Whether or not the node is scrollable. NYI
  isScrollable: boolean;
  // The namespace URI of the node. NYI
  namespaceURI: string;
  // The object id of the parent node.
  parentNodeId: string | undefined;
  // The pseudo element type.
  pseudoType: NodeFront["pseudoType"];
  // The name of the current node.
  tagName: string | undefined;
  // The node's `nodeType` which identifies what the node is.
  type: number;
  // The node's `nodeValue` which identifies the value of the current node.
  value: string | undefined;
  // Whether this node's children are being loaded
  isLoadingChildren: boolean;
}

// export type MarkupTree = { [key: string]: NodeInfo | undefined };

export interface MarkupState {
  // Whether or not to collapse the attributes for nodes.
  collapseAttributes: boolean;
  // The max length of the attribute value prior to truncating the attributes.
  collapseAttributeLength: number;
  // The root node to display in the DOM view.
  rootNode: string | null;
  // The selected node to display in the DOM view.
  selectedNode: string | null;
  // A node that should be scrolled into view.
  scrollIntoViewNode: string | null;
  highlightedNode: string | null;
  nodeBoxModels: EntityState<BoxModel>;
  // An object representing the markup tree. The key to the object represents the object
  // ID of a NodeFront of a given node. The value of each item in the object contains
  // an object representing the properties of the given node.
  tree: EntityState<NodeInfo>;
}

const nodeAdapter = createEntityAdapter<NodeInfo>();
const boxModelAdapter = createEntityAdapter<BoxModel>({
  selectId: boxModel => boxModel.node,
});

export const { selectById: selectNodeBoxModelById } = boxModelAdapter.getSelectors(
  (state: UIState) => state.markup.nodeBoxModels
);

const initialState: MarkupState = {
  collapseAttributes: Services.prefs.getBoolPref(ATTR_COLLAPSE_ENABLED_PREF),
  collapseAttributeLength: Services.prefs.getIntPref(ATTR_COLLAPSE_LENGTH_PREF),
  rootNode: null,
  selectedNode: null,
  scrollIntoViewNode: null,
  highlightedNode: null,
  nodeBoxModels: boxModelAdapter.getInitialState(),
  tree: nodeAdapter.getInitialState(),
};

const markupSlice = createSlice({
  name: "markup",
  initialState,
  reducers: {
    resetMarkup() {
      return initialState;
    },
    newRootAdded(state, action: PayloadAction<NodeInfo>) {
      nodeAdapter.setAll(state.tree, [action.payload]);
      state.rootNode = action.payload.id;
      state.selectedNode = null;
      state.scrollIntoViewNode = null;
    },
    childrenAdded(state, action: PayloadAction<{ parentNodeId: string; children: NodeInfo[] }>) {
      const { parentNodeId, children } = action.payload;

      nodeAdapter.addMany(state.tree, children);
      const parentNodeInfo = state.tree.entities[parentNodeId]!;
      parentNodeInfo.children = children.map(child => child.id);
    },
    updateNodeExpanded(state, action: PayloadAction<{ nodeId: string; isExpanded: boolean }>) {
      const { nodeId, isExpanded } = action.payload;
      nodeAdapter.updateOne(state.tree, { id: nodeId, changes: { isExpanded } });
    },
    updateChildrenLoading(
      state,
      action: PayloadAction<{ nodeId: string; isLoadingChildren: boolean }>
    ) {
      const { nodeId, isLoadingChildren } = action.payload;
      nodeAdapter.updateOne(state.tree, { id: nodeId, changes: { isLoadingChildren } });
    },
    nodeSelected(state, action: PayloadAction<string | null>) {
      state.selectedNode = action.payload;
    },
    updateScrollIntoViewNode(state, action: PayloadAction<string | null>) {
      state.scrollIntoViewNode = action.payload;
    },
    nodeHighlighted(state, action: PayloadAction<string>) {
      state.highlightedNode = action.payload;
    },
    nodeBoxModelLoaded(state, action: PayloadAction<BoxModel>) {
      boxModelAdapter.addOne(state.nodeBoxModels, action);
    },
    nodeHighlightingCleared(state) {
      state.highlightedNode = null;
    },
  },
  extraReducers: builder => {
    // dispatched by actions/timeline.ts, in `playback()`
    builder.addCase("pause/resumed", (state, action) => {
      // Clear out the DOM nodes data whenever the user hits "Play" in the timeline
      return initialState;
    });
  },
});

export const {
  newRootAdded,
  resetMarkup,
  childrenAdded,
  updateNodeExpanded,
  updateChildrenLoading,
  nodeSelected,
  updateScrollIntoViewNode,
  nodeHighlighted,
  nodeBoxModelLoaded,
  nodeHighlightingCleared,
} = markupSlice.actions;

export default markupSlice.reducer;

export const getSelectedDomNodeId = (state: UIState) => state.markup.selectedNode;
