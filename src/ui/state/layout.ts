export type LayoutState = {
  consoleFilterDrawerExpanded: boolean;
  showCommandPalette: boolean;
  showVideoPanel: boolean;
  selectedPrimaryPanel: PrimaryPanelName;
  selectedPanel: SecondaryPanelName;
  viewMode: ViewMode;
  toolboxLayout: ToolboxLayout;
};

export type ViewMode = "dev" | "non-dev";
export const VIEWER_PANELS = ["events", "comments"] as const;
type ViewerPrimaryPanelName = typeof VIEWER_PANELS[number];
export type PrimaryPanelName = "explorer" | "debugger" | "search" | ViewerPrimaryPanelName;
export type SecondaryPanelName =
  | "console"
  | "inspector"
  | "network"
  | "react-components"
  | "debugger";
export type PanelName = PrimaryPanelName | SecondaryPanelName;
export type ToolboxLayout = "ide" | "left" | "bottom";
