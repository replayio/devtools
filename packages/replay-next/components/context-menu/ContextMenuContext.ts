import { MouseEvent, createContext } from "react";

export type ContextMenuContextType = {
  contextMenuEvent: MouseEvent | null;
};

export const ContextMenuContext = createContext<ContextMenuContextType>({
  contextMenuEvent: null,
});
