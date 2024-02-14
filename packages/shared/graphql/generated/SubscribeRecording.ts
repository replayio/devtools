/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL subscription operation: SubscribeRecording
// ====================================================

export interface SubscribeRecording_recording_comments_user {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
}

export interface SubscribeRecording_recording_comments_replies_user {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
}

export interface SubscribeRecording_recording_comments_replies {
  __typename: "CommentReply";
  id: string;
  isPublished: boolean | null;
  content: string;
  createdAt: any;
  updatedAt: any;
  user: SubscribeRecording_recording_comments_replies_user | null;
}

export interface SubscribeRecording_recording_comments {
  __typename: "Comment";
  id: string;
  isPublished: boolean | null;
  content: string;
  createdAt: any;
  updatedAt: any;
  hasFrames: boolean;
  time: number;
  point: string;
  user: SubscribeRecording_recording_comments_user | null;
  replies: SubscribeRecording_recording_comments_replies[];
}

export interface SubscribeRecording_recording_activeSessions_user {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
}

export interface SubscribeRecording_recording_activeSessions {
  __typename: "ActiveSession";
  id: string;
  user: SubscribeRecording_recording_activeSessions_user | null;
}

export interface SubscribeRecording_recording {
  __typename: "Recording";
  uuid: any;
  url: string | null;
  title: string | null;
  duration: number | null;
  createdAt: any;
  private: boolean;
  isInitialized: boolean;
  ownerNeedsInvite: boolean;
  userRole: string;
  operations: any | null;
  resolution: any | null;
  metadata: any | null;
  comments: SubscribeRecording_recording_comments[];
  activeSessions: SubscribeRecording_recording_activeSessions[] | null;
}

export interface SubscribeRecording {
  recording: SubscribeRecording_recording | null;
}

export interface SubscribeRecordingVariables {
  recordingId: any;
}
