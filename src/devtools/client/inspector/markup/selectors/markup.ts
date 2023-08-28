import { UIState } from "ui/state";

export const getMarkupNodes = (state: UIState) => state.markup.tree;

export const getNode = (state: UIState, nodeId: string | null) =>
  typeof nodeId === "string" ? state.markup.tree.entities[nodeId] : undefined;

export const getRootNodeId = (state: UIState) => state.markup.rootNode;

export const getSelectedNodeId = (state: UIState) => state.markup.selectedNode;

export const getScrollIntoViewNodeId = (state: UIState) => state.markup.scrollIntoViewNode;

export const getNodeInfo = (state: UIState, nodeId: string) => state.markup.tree.entities[nodeId];

export const getIsNodeExpanded = (state: UIState, nodeId: string) =>
  state.markup.expandedNodes[nodeId] ?? false;

export const getParentNodeId = (state: UIState, nodeId: string) =>
  getNodeInfo(state, nodeId)?.parentNodeId;

export const getHighlightedNodesLoading = (state: UIState) => state.markup.highlightedNodesLoading;
