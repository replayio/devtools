import { RecordingId, SourceLocation } from "@replayio/protocol";

export enum Nag {
  FIRST_LOG_IN = "first_log_in",
  FIRST_REPLAY_2 = "first_replay_2",
  FIRST_BREAKPOINT_EDIT = "first_breakpoint_edit",
  FIRST_BREAKPOINT_ADD = "first_breakpoint_add",
  FIRST_BREAKPOINT_SAVE = "first_breakpoint_save",
  FIRST_CONSOLE_NAVIGATE = "first_console_navigate",
  DOWNLOAD_REPLAY = "download_replay",
}

export enum EmailSubscription {
  COLLABORATOR_REQUEST = "collaborator_request",
  REPLAY_COMMENT = "replay_comment",
  NEW_TEAM_INVITE = "new_team_invite",
}

export interface User {
  name: string;
  picture: string;
  id: string;
  internal: boolean;
}

export type UserInfo = {
  motd: string | null;
  acceptedTOSVersion: number | null;
  name: string;
  picture: string;
  email: string;
  id: string;
  internal: boolean;
  nags: Nag[];
  unsubscribedEmailTypes: EmailSubscription[];
  features: { library: boolean };
};

interface Remark {
  content: string;
  createdAt: string;
  hasFrames: boolean;
  id: string;
  isPublished: boolean;
  point: string;
  sourceLocation: SourceLocation | null;
  time: number;
  updatedAt: string;
  user: User;
}

export interface CommentPosition {
  x: number;
  y: number;
}

export interface Comment extends Remark {
  position: CommentPosition | null;
  networkRequestId: string | null;
  primaryLabel?: string;
  replies: Reply[];
  secondaryLabel?: string;
}

export interface Reply extends Remark {
  parentId: string;
}
