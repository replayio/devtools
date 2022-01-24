import { PrimaryPanelName } from "ui/state/app";

export type LayoutState = {
  showCommandPalette: boolean;
  showEditor: boolean;
  showVideoPanel: boolean;
  selectedPrimaryPanel: PrimaryPanelName;
  viewMode: ViewMode;
};

export type ViewMode = "dev" | "non-dev";
