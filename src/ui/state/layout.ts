import { Reply } from "./comments";

export type LayoutState = {
  showCommandPalette: boolean;
  theme: string;
  selectedPanel: PanelName;
  selectedPrimaryPanel: PrimaryPanelName;
  modal: ModalType | null;
  modalOptions: ModalOptionsType;
  viewMode: ViewMode;
  canvas: Canvas | null;
  defaultSettingsTab: SettingsTabTitle;
  showEditor: boolean;
  showVideoPanel: boolean;
  loadingPageTipIndex: number;
};

export type PanelName =
  | "comments"
  | "console"
  | "debugger"
  | "inspector"
  | "network"
  | "react-components"
  | "viewer";

export type PrimaryPanelName = "explorer" | "debug" | "comments" | "events" | "search";

export type ViewMode = "dev" | "non-dev";

export type ModalOptionsType = {
  recordingId?: string;
  view?: string;
  loom?: string;
  comment?: Reply;
} | null;

export type ModalType =
  | "sharing"
  | "login"
  | "settings"
  | "new-workspace"
  | "workspace-settings"
  | "onboarding"
  | "single-invite"
  | "browser-launch"
  | "first-replay"
  | "download-replay"
  | "trimming"
  | "privacy"
  | "loom"
  | "attachment"
  | "sourcemap-setup";

export type SettingsTabTitle =
  | "Experimental"
  | "Invitations"
  | "Support"
  | "Personal"
  | "Legal"
  | "API Keys"
  | "Preferences";

export interface Canvas {
  gDevicePixelRatio: number;
  height: number;
  left: number;
  scale: number;
  top: number;
  width: number;
}
