import { UIState } from "ui/state";

export const getRootNodeId = (state: UIState) => state.markup.rootNode;

export const getSelectedNodeId = (state: UIState) => state.markup.selectedNode;

export const getScrollIntoViewNodeId = (state: UIState) => state.markup.scrollIntoViewNode;

export const getIsNodeExpanded = (state: UIState, nodeId: string) =>
  state.markup.expandedNodes[nodeId] ?? false;
