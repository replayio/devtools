export type LayoutState = {
  showCommandPalette: boolean;
  showEditor: boolean;
  showVideoPanel: boolean;
  selectedPrimaryPanel: PrimaryPanelName;
  selectedPanel: SecondaryPanelName;
  viewMode: ViewMode;
};

export type ViewMode = "dev" | "non-dev";
export type PrimaryPanelName = "explorer" | "debugger" | "comments" | "events" | "search";
export type SecondaryPanelName = "console" | "inspector" | "network" | "react-components";
export type PanelName = PrimaryPanelName | SecondaryPanelName;
