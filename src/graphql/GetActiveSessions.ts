/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetActiveSessions
// ====================================================

export interface GetActiveSessions_recording_activeSessions_user {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
}

export interface GetActiveSessions_recording_activeSessions {
  __typename: "ActiveSession";
  id: string;
  user: GetActiveSessions_recording_activeSessions_user | null;
}

export interface GetActiveSessions_recording {
  __typename: "Recording";
  uuid: any;
  activeSessions: GetActiveSessions_recording_activeSessions[] | null;
}

export interface GetActiveSessions {
  recording: GetActiveSessions_recording | null;
}

export interface GetActiveSessionsVariables {
  recordingId: any;
}
