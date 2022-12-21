import { CSSProperties, DragEventHandler, createContext } from "react";

import { Panel, PanelId } from "./types";

export type PanelContextType = {
  direction: "horizontal" | "vertical";
  getPanelStyle: (id: PanelId) => CSSProperties;
  registerResizeHandle: (idBefore: PanelId, idAfter: PanelId) => DragEventHandler<HTMLDivElement>;
  registerPanel: (id: PanelId, panel: Panel) => void;
  unregisterPanel: (id: PanelId) => void;
  unregisterResizeHandle: (idBefore: PanelId, idAfter: PanelId) => void;
};

export const PanelContext = createContext<PanelContextType | null>(null);
