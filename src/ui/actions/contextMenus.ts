import { Action } from "redux";

export interface GutterContextMenu {
  column: number;
  line: number;
  location: number;
  sourceId: string;
  sourceUrl: string;
}

export interface ContextMenu {
  x: number;
  y: number;
  contextMenuItem: GutterContextMenu;
}

type OpenContextMenu = Action<"open_context_menu"> & { contextMenu: ContextMenu };
type CloseContextMenu = Action<"close_context_menu">;

export function openContextMenu(contextMenu: ContextMenu): OpenContextMenu {
  return { type: "open_context_menu", contextMenu };
}

export function closeContextMenu(): CloseContextMenu {
  return { type: "close_context_menu" };
}

export type ContextMenusAction = OpenContextMenu | CloseContextMenu;
