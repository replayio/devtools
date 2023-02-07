/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export interface AddCommentInput {
  content: string;
  hasFrames: boolean;
  isPublished: boolean;
  networkRequestId?: string | null;
  point: string;
  position?: any | null;
  primaryLabel?: string | null;
  recordingId: string;
  secondaryLabel?: string | null;
  sourceLocation?: any | null;
  time: number;
  type?: string | null;
  typeData?: any | null;
}

export interface AddCommentReplyInput {
  commentId: string;
  content: string;
  isPublished: boolean;
}

export interface AddPointInput {
  badge?: string | null;
  column: number;
  condition?: string | null;
  content: string;
  key: string;
  line: number;
  recordingId: string;
  sourceId: string;
}

export interface DeletePointInput {
  key: string;
}

export interface UpdatePointInput {
  badge?: string | null;
  condition?: string | null;
  content: string;
  key: string;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
