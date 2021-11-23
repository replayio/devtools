import {
  SessionId,
  PointDescription,
  Location,
  MouseEvent,
  loadedRegions,
  KeyboardEvent,
  NavigationEvent,
  KeyboardEventKind,
  MouseEventKind,
} from "@recordreplay/protocol";
import type { RecordingTarget } from "protocol/thread/thread";
import { Workspace } from "ui/types";
import { Reply } from "./comments";

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
  | "attachment";
export type WorkspaceId = string;
export type SettingsTabTitle =
  | "Experimental"
  | "Invitations"
  | "Support"
  | "Personal"
  | "Legal"
  | "API Keys"
  | "Preferences";

export interface ExpectedError {
  message: string;
  content: string;
  action?: "sign-in" | "refresh" | "library";
}

export type UnexpectedError = {
  message: string;
  content: string;
  action?: "refresh" | "library";
};

export interface UploadInfo {
  amount: string;
  total?: string;
}

export interface AppState {
  analysisPoints: AnalysisPoints;
  awaitingSourcemaps: boolean;
  canvas: Canvas | null;
  defaultSettingsTab: SettingsTabTitle;
  displayedLoadingProgress: number | null;
  events: Events;
  expectedError: ExpectedError | null;
  hoveredLineNumberLocation: Location | null;
  indexing: number;
  initializedPanels: PanelName[];
  isNodePickerActive: boolean;
  loadedRegions: loadedRegions | null;
  loading: number;
  loadingFinished: boolean;
  loadingPageTipIndex: number;
  modal: ModalType | null;
  modalOptions: ModalOptionsType;
  recordingDuration: number;
  recordingTarget: RecordingTarget | null;
  recordingWorkspace: Workspace | null;
  selectedPanel: PanelName;
  selectedPrimaryPanel: PrimaryPanelName;
  sessionId: SessionId | null;
  showEditor: boolean;
  showVideoPanel: boolean;
  splitConsoleOpen: boolean;
  theme: string;
  trialExpired: boolean;
  unexpectedError: UnexpectedError | null;
  uploading: UploadInfo | null;
  videoNode: HTMLVideoElement | null;
  videoUrl: string | null;
  viewMode: ViewMode;
  workspaceId: WorkspaceId | null;
}

export interface AnalysisPoints {
  [key: string]: PointDescription[] | "error";
}

interface Events {
  [key: string]: ReplayEvent[];
}

type ReplayMouseEvent = Omit<MouseEvent, "kind"> & {
  kind: "mousedown";
};
type ReplayNavigationEvent = Omit<NavigationEvent, "kind"> & {
  kind: "navigation";
};
type ReplayKeyboardEvent = KeyboardEvent;

export type ReplayEvent = ReplayMouseEvent | ReplayKeyboardEvent | ReplayNavigationEvent;

export type EventCategory = "mouse" | "keyboard" | "navigation";
export type EventKind = MouseEventKind | KeyboardEventKind | string;

export interface Canvas {
  gDevicePixelRatio: number;
  height: number;
  left: number;
  scale: number;
  top: number;
  width: number;
}
