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
  point: string;
  recordingId: string;
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
  condition?: string | null;
  content: string;
  key: string;
  recordingId: string;
  sourceLocation: any;
}

export interface DeletePointInput {
  key: string;
  recordingId: string;
}

export interface UpdatePointInput {
  badge?: string | null;
  condition?: string | null;
  content: string;
  key: string;
  recordingId: string;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
