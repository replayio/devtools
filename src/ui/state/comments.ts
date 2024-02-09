import { RecordingId } from "@replayio/protocol";

import { CommentType, User } from "shared/graphql/types";

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
  hasFrames: boolean;
  type: CommentType;
  typeData: any | null;
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
  time: number;
  updatedAt: string;
  user: User | null;
}

export interface Comment extends Remark {
  replies: Reply[];
  type: string | null;
  typeData: any | null;

  // TODO [FE-1058]
  // Legacy attributes that should eventually be deleted in favor of type/typeData
  position: CommentPosition | null;
  networkRequestId: string | null;
  primaryLabel?: string | null;
  secondaryLabel?: string | null;
  sourceLocation: SourceLocation | null;
}

export interface Reply extends Remark {
  parentId: string;
}
