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
  isPublished: boolean | null;
  content: string;
  createdAt: any;
  updatedAt: any;
  user: GetComments_recording_comments_replies_user | null;
}

export interface GetComments_recording_comments {
  __typename: "Comment";
  id: string;
  isPublished: boolean | null;
  content: string;
  createdAt: any;
  updatedAt: any;
  hasFrames: boolean;
  time: number;
  point: string;
  type: string | null;
  typeData: any | null;
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
