import { LocalNag } from "ui/setup/prefs";

export type LayoutState = {
  showCommandPalette: boolean;
  showVideoPanel: boolean;
  selectedPrimaryPanel: PrimaryPanelName;
  selectedPanel: SecondaryPanelName;
  viewMode: ViewMode;
  toolboxLayout: ToolboxLayout;
  localNags: LocalNag[];
};

export type ViewMode = "dev" | "non-dev";
export const VIEWER_PANELS = ["events", "comments"] as const;
type ViewerPrimaryPanelName = typeof VIEWER_PANELS[number];
export type PrimaryPanelName =
  | "explorer"
  | "debugger"
  | "protocol"
  | "search"
  | ViewerPrimaryPanelName;
export type SecondaryPanelName =
  | "console"
  | "inspector"
  | "network"
  | "react-components"
  | "redux-devtools"
  | "debugger";
export type PanelName = PrimaryPanelName | SecondaryPanelName;
export type ToolboxLayout = "bottom" | "full" | "ide" | "left";
