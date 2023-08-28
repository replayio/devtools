// Side-effectful import - needed to initialize these prefs
import { EntityState, PayloadAction, createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import { Attr, BoxModel, PseudoType } from "@replayio/protocol";

import { userData } from "shared/user-data/GraphQL/UserData";
import { UIState } from "ui/state";

export interface NodeInfo {
  // A list of the node's attributes.
  attributes: Attr[];
  // Array of child node object ids.
  children: string[];
  // The display name for the UI. This is either the lower case of the node's tag
  // name or the doctype string for a document type node.
  displayName: string;
  // Whether or not the node has child nodes.
  hasChildren: boolean;
  // An unique object id.
  id: string;
  // Whether or not the node is attached to the document (?)
  isConnected: boolean;
  isElement: boolean;
  // Whether or not the node is expanded.
  // isExpanded: boolean;
  // The namespace URI of the node. NYI
  namespaceURI: string;
  // The object id of the parent node.
  parentNodeId: string | undefined;
  // The pseudo element type.
  pseudoType: PseudoType;
  // The name of the current node.
  tagName: string | undefined;
  // The node's `nodeType` which identifies what the node is.
  type: number;
  // The node's `nodeValue` which identifies the value of the current node.
  value: string | undefined;
  // Whether this node's children are being loaded
  isLoadingChildren: boolean;
}

export type SelectionReason =
  | "navigateaway"
  | "markup"
  | "debugger"
  | "breadcrumbs"
  | "inspectorsearch"
  | "box-model"
  | "console"
  | "keyboard"
  | "unknown";

type ExpandedNodes = Record<string, boolean | undefined>;

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
  selectionReason: SelectionReason | null;
  // A node that should be scrolled into view.
  scrollIntoViewNode: string | null;
  highlightedNodes: string[] | null;
  // True when the user has taken an action to highlight nodes in the video and
  // the client is fetching the data required
  highlightedNodesLoading: boolean;
  nodeBoxModels: EntityState<BoxModel>;
  // An object representing the markup tree. The key to the object represents the object
  // ID of a given node. The value of each item in the object contains
  // an object representing the properties of the given node.
  tree: EntityState<NodeInfo>;
  // The document could not be loaded at the current execution point.
  loadingFailed: boolean;
  expandedNodes: ExpandedNodes;
}

const nodeAdapter = createEntityAdapter<NodeInfo>();
const boxModelAdapter = createEntityAdapter<BoxModel>({
  selectId: boxModel => boxModel.node,
});

export const { selectById: getMarkupNodeById } = nodeAdapter.getSelectors(
  (state: UIState) => state.markup.tree
);

export const { selectById: getNodeBoxModelById } = boxModelAdapter.getSelectors(
  (state: UIState) => state.markup.nodeBoxModels
);

const initialState: MarkupState = {
  collapseAttributes: userData.get("inspector_collapseAttributes"),
  collapseAttributeLength: userData.get("inspector_collapseAttributeLength"),
  rootNode: null,
  selectedNode: null,
  selectionReason: null,
  scrollIntoViewNode: null,
  expandedNodes: {},
  highlightedNodes: null,
  highlightedNodesLoading: false,
  loadingFailed: false,
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
    },
    childrenAdded(state, action: PayloadAction<{ parent: NodeInfo; children: NodeInfo[] }>) {
      const { parent, children } = action.payload;

      nodeAdapter.addMany(state.tree, children);
      if (!state.tree.entities[parent.id]) {
        // If by chance the parent doesn't exist yet, add it
        nodeAdapter.upsertOne(state.tree, parent);
      }
      let parentNodeInfo = state.tree.entities[parent.id]!;
      parentNodeInfo.children = children.map(child => child.id);
    },
    updateNodeExpanded(state, action: PayloadAction<{ nodeId: string; isExpanded: boolean }>) {
      const { nodeId, isExpanded } = action.payload;
      state.expandedNodes[nodeId] = isExpanded;
    },
    updateChildrenLoading(
      state,
      action: PayloadAction<{ nodeId: string; isLoadingChildren: boolean }>
    ) {
      const { nodeId, isLoadingChildren } = action.payload;
      nodeAdapter.updateOne(state.tree, { id: nodeId, changes: { isLoadingChildren } });
    },
    nodeSelected: {
      reducer(
        state,
        action: PayloadAction<{ nodeId: string | null; reason: SelectionReason | undefined }>
      ) {
        const { nodeId, reason = null } = action.payload;
        state.selectedNode = nodeId;
        state.selectionReason = nodeId ? reason : null;
      },
      prepare(nodeId: string | null, reason?: SelectionReason) {
        return {
          payload: { nodeId, reason },
        };
      },
    },
    updateScrollIntoViewNode(state, action: PayloadAction<string | null>) {
      state.scrollIntoViewNode = action.payload;
    },
    nodesHighlighted(state, action: PayloadAction<string[]>) {
      state.highlightedNodes = action.payload;
    },
    nodeBoxModelsLoaded(state, action: PayloadAction<BoxModel[]>) {
      boxModelAdapter.setAll(state.nodeBoxModels, action);
    },
    setHighlightedNodesLoading(state, action: PayloadAction<boolean>) {
      state.highlightedNodesLoading = action.payload;
    },
    nodeHighlightingCleared(state) {
      state.highlightedNodes = null;
    },
    // The document could not be loaded at the current execution point.
    updateLoadingFailed(state, action: PayloadAction<boolean>) {
      state.loadingFailed = action.payload;
    },
  },
  extraReducers: builder => {
    // dispatched by actions/timeline.ts, in `playback()`
    builder.addCase("pause/resumed", (state, action) => {
      // Clear out the DOM nodes data whenever the user hits "Play" in the timeline.
      // However, preserve whatever nodes may be highlighted at the time,
      // since these can now be independent of the current pause (such as
      // highlighting from a test step)
      return {
        ...initialState,
        highlightedNodes: state.highlightedNodes,
        nodeBoxModels: state.nodeBoxModels,
      };
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
  nodesHighlighted,
  nodeBoxModelsLoaded,
  nodeHighlightingCleared,
  setHighlightedNodesLoading,
  updateLoadingFailed,
} = markupSlice.actions;

export default markupSlice.reducer;

export const getSelectedDomNodeId = (state: UIState) => state.markup.selectedNode;
