import { UIState } from "ui/state";
import { NodeInfo } from "../state/markup";

export const getNode = (state: UIState, nodeId: string | null) =>
  typeof nodeId === "string" ? state.markup.tree[nodeId] : undefined;

export const getRootNodeId = (state: UIState) => state.markup.rootNode;

export const getSelectedNodeId = (state: UIState) => state.markup.selectedNode;

export const getScrollIntoViewNodeId = (state: UIState) => state.markup.scrollIntoViewNode;
