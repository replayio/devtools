export type LayoutState = {
  consoleFilterDrawerExpanded: boolean;
  showCommandPalette: boolean;
  showEditor: boolean;
  showVideoPanel: boolean;
  selectedPrimaryPanel: PrimaryPanelName;
  selectedPanel: SecondaryPanelName;
  viewMode: ViewMode;
};

export type ViewMode = "dev" | "non-dev";
export const VIEWER_PANELS = ["events", "comments"] as const;
type ViewerPrimaryPanelName = typeof VIEWER_PANELS[number];
export type PrimaryPanelName = "explorer" | "debugger" | "search" | ViewerPrimaryPanelName;
export type SecondaryPanelName = "console" | "inspector" | "network" | "react-components";
export type PanelName = PrimaryPanelName | SecondaryPanelName;
