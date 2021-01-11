import {
  RecordingId,
  sessionError,
  SessionId,
  PointDescription,
  Location,
  MouseEvent,
} from "@recordreplay/protocol";

export type PanelName = "console" | "debugger" | "inspector";
export type PrimaryPanelName = "explorer" | "debug";
export type ViewMode = "dev" | "non-dev";

export interface Modal {
  type: string;
  recordingId: RecordingId;
  opaque: boolean;
}

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
  modal: Modal | null;
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
}

export interface AnalysisPoints {
  [key: string]: PointDescription;
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
  recording_id: RecordingId;
  time: number;
  point: string;
  has_frames: boolean;
}
