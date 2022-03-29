/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetComments
// ====================================================

export interface GetComments_recording_comments_user {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
}

export interface GetComments_recording_comments_replies_user {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
}

export interface GetComments_recording_comments_replies {
  __typename: "CommentReply";
  id: string;
  content: string;
  createdAt: any;
  updatedAt: any;
  user: GetComments_recording_comments_replies_user | null;
}

export interface GetComments_recording_comments {
  __typename: "Comment";
  id: string;
  content: string;
  primaryLabel: string | null;
  secondaryLabel: string | null;
  createdAt: any;
  updatedAt: any;
  hasFrames: boolean;
  sourceLocation: any | null;
  time: number;
  point: string;
  position: any | null;
  networkRequestId: string | null;
  user: GetComments_recording_comments_user | null;
  replies: GetComments_recording_comments_replies[];
}

export interface GetComments_recording {
  __typename: "Recording";
  uuid: any;
  comments: GetComments_recording_comments[];
}

export interface GetComments {
  recording: GetComments_recording | null;
}

export interface GetCommentsVariables {
  recordingId: any;
}
