/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetCommentsTime
// ====================================================

export interface GetCommentsTime_recording_comments {
  __typename: "Comment";
  id: string;
  hasFrames: boolean;
  point: string;
  time: number;
}

export interface GetCommentsTime_recording {
  __typename: "Recording";
  uuid: any;
  comments: GetCommentsTime_recording_comments[];
}

export interface GetCommentsTime {
  recording: GetCommentsTime_recording | null;
}

export interface GetCommentsTimeVariables {
  recordingId: any;
}
