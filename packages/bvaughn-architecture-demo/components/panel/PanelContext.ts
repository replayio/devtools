import { CSSProperties, createContext } from "react";

import { Panel, PanelId, ResizeHandler } from "./types";

export type PanelContextType = {
  direction: "horizontal" | "vertical";
  getPanelStyle: (id: PanelId) => CSSProperties;
  registerResizeHandle: (idBefore: PanelId, idAfter: PanelId) => ResizeHandler;
  registerPanel: (id: PanelId, panel: Panel) => void;
};

export const PanelContext = createContext<PanelContextType | null>(null);
