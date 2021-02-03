import {
  RecordingId,
  sessionError,
  SessionId,
  PointDescription,
  Location,
  MouseEvent,
} from "@recordreplay/protocol";

export type PanelName = "console" | "debugger" | "inspector" | "comments";
export type PrimaryPanelName = "explorer" | "debug";
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
  pendingNotification: any;
  analysisPoints: AnalysisPoints;
  viewMode: ViewMode;
  narrowMode: boolean;
  hoveredLineNumberLocation: Location | null;
  events: Events;
  isNodePickerActive: boolean;
  pendingComment: PendingComment | null;
  canvas: Canvas | null;
  commentPointer: boolean;
  hoveredComment: any;
  activeComment: any;
}

export interface AnalysisPoints {
  [key: string]: PointDescription[];
}

interface Events {
  [key: string]: MouseEvent[];
}

export type Event = "mousedown";

export interface Comment {
  content: string;
  created_at: string;
  has_frames: boolean;
  id: string;
  point: string;
  recording_id: RecordingId;
  parent_id: string;
  time: number;
  updated_at: string;
  user_id: string;
  __typename: string;
}

export interface PendingComment {
  recording_id: RecordingId | null;
  time: number;
  point: string;
  has_frames: boolean;
  position: CommentPosition | null;
}

interface CommentPosition {
  x: number;
  y: number;
}

export interface Canvas {
  gDevicePixelRatio: number;
  height: number;
  left: number;
  scale: number;
  top: number;
  width: number;
}
