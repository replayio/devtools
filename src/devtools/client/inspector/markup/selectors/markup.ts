import { UIState } from "ui/state";

export const getSelectedNodeId = (state: UIState) => state.markup.selectedNode;
export const getHighlightedNodeIds = (state: UIState) => state.markup.highlightedNodes;
