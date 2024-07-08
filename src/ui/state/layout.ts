import { ViewMode } from "shared/user-data/GraphQL/config";
import { LocalNag } from "ui/setup/prefs";

export type LayoutState = {
  showCommandPalette: boolean;
  selectedPrimaryPanel: PrimaryPanelName | null;
  selectedPanel: SecondaryPanelName;
  viewMode: ViewMode;
  toolboxLayout: ToolboxLayout;
  localNags: LocalNag[];
};

export const VIEWER_PANELS = ["cypress", "tour", "passport", "events", "comments"] as const;
type ViewerPrimaryPanelName = (typeof VIEWER_PANELS)[number];
export type PrimaryPanelName =
  | "explorer"
  | "debugger"
  | "protocol"
  | "search"
  | "react"
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
