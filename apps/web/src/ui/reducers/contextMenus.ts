import { ContextMenu, ContextMenusAction } from "ui/actions/contextMenus";
import { UIState } from "ui/state";

export interface ContextMenusState {
  contextMenu: ContextMenu | null;
}

function initialState(): ContextMenusState {
  return { contextMenu: null };
}

export default function update(
  state = initialState(),
  action: ContextMenusAction
): ContextMenusState {
  switch (action.type) {
    case "open_context_menu": {
      return {
        ...state,
        contextMenu: action.contextMenu,
      };
    }
    case "close_context_menu": {
      return {
        ...state,
        contextMenu: null,
      };
    }
    default: {
      return state;
    }
  }
}

export const getContextMenu = (state: UIState) => state.contextMenus.contextMenu;
