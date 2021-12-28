export type LayoutState = {
  showCommandPalette: boolean;
  showEditor: boolean;
  showVideoPanel: boolean;
  selectedPrimaryPanel: PrimaryPanelName;
  viewMode: ViewMode;
};

export type PrimaryPanelName = "explorer" | "debug" | "comments" | "events" | "search";
export type ViewMode = "dev" | "non-dev";
