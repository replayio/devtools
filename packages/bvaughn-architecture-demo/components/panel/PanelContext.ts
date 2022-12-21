import { CSSProperties, createContext } from "react";

import { Panel } from "./types";

export type PanelContextType = {
  direction: "horizontal" | "vertical";
  getPanelStyle: (id: string) => CSSProperties;
  registerPanel: (id: string, panel: Panel) => void;
  unregisterPanel: (id: string) => void;
};

export const PanelContext = createContext<PanelContextType | null>(null);
