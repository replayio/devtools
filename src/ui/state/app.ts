import { RecordingId, sessionError, SessionId, PointDescription } from "record-replay-protocol";

export type PanelName = "console" | "debugger" | "inspector";

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
  isToolboxOpen: boolean;
  loading: number;
  uploading: UploadInfo | null;
  expectedError: ExpectedError | null;
  unexpectedError: sessionError | null;
  modal: Modal | null;
  selectedPanel: PanelName;
  lastAnalysisPoints: PointDescription[] | null;
  pendingNotification: any;
}
