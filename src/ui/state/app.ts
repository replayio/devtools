import { NavigationEvent, SessionId } from "@replayio/protocol";

import type { RecordingTarget } from "replay-next/src/suspense/BuildIdCache";
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
  | "attachment"
  | "browser-launch"
  | "first-replay"
  | "login"
  | "loom"
  | "new-workspace"
  | "onboarding"
  | "passport-dismiss"
  | "privacy"
  | "rename-replay"
  | "settings"
  | "sharing"
  | "single-invite"
  | "sourcemap-setup"
  | "workspace-settings";
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

export type NodePickerType = "reactComponent" | "domElement";
export type NodePickerStatus = "disabled" | "initializing" | "active";

export interface AppState {
  accessToken: string | null;
  awaitingSourcemaps: boolean;
  canvas: Canvas | null;
  defaultSelectedReactElementId: number | null;
  defaultSettingsTab: SettingsTabTitle;
  displayedLoadingProgress: number | null;
  expectedError: ExpectedError | null;
  hoveredCommentId: string | null;
  loading: number;
  loadingFinished: boolean;
  modal: ModalType | null;
  modalOptions: ModalOptionsType;
  mode: AppMode;
  processing: boolean | null;
  processingProgress: number | null;
  recordingId: string | null;
  recordingTarget: RecordingTarget | null;
  recordingWorkspace: Workspace | null;
  selectedCommentId: string | null;
  sessionId: SessionId | null;
  unexpectedError: UnexpectedError | null;
  uploading: UploadInfo | null;
  workspaceId: WorkspaceId | null;
}

export type AppMode = "devtools" | "sourcemap-visualizer";

export interface Canvas {
  gDevicePixelRatio: number;
  height: number;
  left: number;
  scale: number;
  top: number;
  width: number;
}
