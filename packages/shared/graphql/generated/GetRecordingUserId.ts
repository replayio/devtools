/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetRecordingUserId
// ====================================================

export interface GetRecordingUserId_recording_owner {
  __typename: "User";
  id: string;
}

export interface GetRecordingUserId_recording {
  __typename: "Recording";
  uuid: any;
  owner: GetRecordingUserId_recording_owner | null;
}

export interface GetRecordingUserId {
  recording: GetRecordingUserId_recording | null;
}

export interface GetRecordingUserIdVariables {
  recordingId: any;
}
