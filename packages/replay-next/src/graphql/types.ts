export enum Nag {
  FIRST_LOG_IN = "first_log_in",
  FIRST_REPLAY_2 = "first_replay_2",
  VIEW_DEVTOOLS = "view_devtools",
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
  name: string | null;
  picture: string | null;
  email: string;
  id: string;
  internal: boolean;
  nags: Nag[];
  unsubscribedEmailTypes: EmailSubscription[];
  features: { library: boolean };
};

export interface CommentSourceLocation {
  sourceUrl: string;
  line: number;
  column: number;
  sourceId: string;
}

export type CommentType = "source-code" | "network-request" | "visual";

interface Remark {
  content: string;
  createdAt: string;
  hasFrames: boolean;
  id: string;
  isPublished: boolean;
  point: string;
  sourceLocation: CommentSourceLocation | null;
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
  type: string | null;
  typeData: any | null;
}

export interface Reply extends Remark {
  parentId: string;
}
