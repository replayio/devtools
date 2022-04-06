import {
  SessionId,
  PointDescription,
  Location,
  MouseEvent,
  KeyboardEvent,
  NavigationEvent,
  KeyboardEventKind,
  MouseEventKind,
  ExecutionPoint,
  TimeStampedPointRange,
} from "@recordreplay/protocol";
import type { RecordingTarget } from "protocol/thread/thread";
import { Workspace } from "ui/types";
import { Reply } from "./comments";
import { PanelName } from "./layout";

export type ModalOptionsType = {
  recordingId?: string;
  title?: string;
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
  | "focusing"
  | "privacy"
  | "loom"
  | "attachment"
  | "sourcemap-setup"
  | "rename-replay";
export type WorkspaceId = string;
export type WorkspaceUuid = string;
export type SettingsTabTitle =
  | "Experimental"
  | "Invitations"
  | "Support"
  | "Personal"
  | "Legal"
  | "API Keys"
  | "Preferences";

export type ErrorActions = "sign-in" | "refresh" | "library" | "request-access" | "team-billing";
export interface ExpectedError {
  message: string;
  content: string;
  action?: ErrorActions;
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

export type AppTheme = "light" | "dark";

export interface LoadedRegions {
  loading: TimeStampedPointRange[];
  loaded: TimeStampedPointRange[];
  indexed: TimeStampedPointRange[];
}

export interface AppState {
  mode: AppMode;
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
  loadedRegions: LoadedRegions | null;
  loading: number;
  loadingFinished: boolean;
  loadingPageTipIndex: number;
  modal: ModalType | null;
  modalOptions: ModalOptionsType;
  recordingDuration: number;
  recordingTarget: RecordingTarget | null;
  recordingWorkspace: Workspace | null;
  sessionId: SessionId | null;
  theme: AppTheme;
  trialExpired: boolean;
  unexpectedError: UnexpectedError | null;
  uploading: UploadInfo | null;
  videoUrl: string | null;
  workspaceId: WorkspaceId | null;
  mouseTargetsLoading: boolean;
  currentPoint: ExecutionPoint | null;
}

export type AnalysisPoints = Record<string, AnalysisPayload>;
export type AnalysisPayload = {
  data: PointDescription[];
  error: AnalysisError | null;
};
export enum AnalysisError {
  TooManyPoints = "too-many-points",
  Default = "default",
}
export type AppMode = "devtools" | "sourcemap-visualizer";

interface Events {
  [key: string]: ReplayEvent[];
}

// Todo: We should move this deifnition to the protocol instead of typing it here.
export type ReplayNavigationEvent = Omit<NavigationEvent, "kind"> & {
  kind: "navigation";
};

export type ReplayEvent = MouseEvent | KeyboardEvent | ReplayNavigationEvent;

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

export enum ProtocolError {
  TooManyPoints = 55,
}
