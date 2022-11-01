import { RecordingId } from "@replayio/protocol";

import { User } from "ui/types";

export interface SourceLocation {
  sourceUrl: string;
  line: number;
  column: number;
  sourceId: string;
}

export interface CommentPosition {
  x: number;
  y: number;
}

export type CommentOptions = {
  position: CommentPosition | null;
  hasFrames: boolean;
  sourceLocation: SourceLocation | null;
  networkRequestId?: string;
};

export interface Remark {
  content: string;
  createdAt: string;
  hasFrames: boolean;
  id: string;
  // Unpublished remarks are only visible to their author.
  // Published comments are visible to everyone (who can view the recording).
  isPublished: boolean | null;
  point: string;
  recordingId: RecordingId;
  sourceLocation: SourceLocation | null;
  time: number;
  updatedAt: string;
  user: User | null;
}

export interface Comment extends Remark {
  position: CommentPosition | null;
  networkRequestId: string | null;
  primaryLabel?: string | null;
  replies: Reply[];
  secondaryLabel?: string | null;
}

export interface Reply extends Remark {
  parentId: string;
}
