import {
  ExecutionPoint,
  KeyboardEvent,
  KeyboardEventKind,
  MouseEvent,
  MouseEventKind,
  NavigationEvent,
  SessionId,
  TimeStampedPointRange,
} from "@replayio/protocol";

import type { RecordingTarget } from "protocol/thread/thread";
import { Workspace } from "shared/graphql/types";

import { Reply } from "./comments";

export type ModalOptionsType = {
  recordingId?: string;
  title?: string;
  view?: string;
  loom?: string;
  comment?: Reply;
  instructions?: string;
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
  | "Preferences"
  | "Advanced";

export type ErrorActions =
  | "sign-in"
  | "refresh"
  | "library"
  | "request-access"
  | "team-billing"
  | "try-again";
export interface ExpectedError {
  message: string;
  content: string;
  action?: ErrorActions;
  onAction?: () => void;
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

export type AppTheme = "light" | "dark" | "system";

export interface LoadedRegions {
  loading: TimeStampedPointRange[];
  loaded: TimeStampedPointRange[];
  indexed: TimeStampedPointRange[];
}

export interface AppState {
  mode: AppMode;
  assist: boolean;
  awaitingSourcemaps: boolean;
  canvas: Canvas | null;
  defaultSettingsTab: SettingsTabTitle;
  displayedLoadingProgress: number | null;
  events: Events;
  expectedError: ExpectedError | null;
  isNodePickerActive: boolean;
  isNodePickerInitializing: boolean;
  loadedRegions: LoadedRegions | null;
  loading: number;
  loadingFinished: boolean;
  loadingStatusSlow: boolean;
  loadingPageTipSeed: number;
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
