import {
  RecordingId,
  sessionError,
  SessionId,
  PointDescription,
  Location,
  MouseEvent,
} from "@recordreplay/protocol";

import { Canvas } from "protocol/graphics";

export type PanelName = "console" | "debugger" | "inspector";
export type PrimaryPanelName = "explorer" | "debug" | "comments";
export type ViewMode = "dev" | "non-dev";
export type ModalType = "sharing" | "login";

export interface ExpectedError {
  message: string;
  action?: string;
}

export interface UploadInfo {
  amount: string;
  total?: string;
}

export interface AppState {
  recordingId: RecordingId | null;
  sessionId: SessionId | null;
  theme: string;
  splitConsoleOpen: boolean;
  loading: number;
  uploading: UploadInfo | null;
  expectedError: ExpectedError | null;
  unexpectedError: sessionError | null;
  modal: ModalType | null;
  selectedPanel: PanelName;
  selectedPrimaryPanel: PrimaryPanelName;
  initializedPanels: PanelName[];
  analysisPoints: AnalysisPoints;
  viewMode: ViewMode;
  narrowMode: boolean;
  hoveredLineNumberLocation: Location | null;
  events: Events;
  isNodePickerActive: boolean;
  canvas: Canvas | null;
}

export interface AnalysisPoints {
  [key: string]: PointDescription[];
}

interface Events {
  [key: string]: MouseEvent[];
}

export type Event = "mousedown";
