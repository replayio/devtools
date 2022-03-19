/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: RequestRecordingAccess
// ====================================================

export interface RequestRecordingAccess_requestRecordingAccess {
  __typename: "RequestRecordingAccess";
  success: boolean | null;
}

export interface RequestRecordingAccess {
  requestRecordingAccess: RequestRecordingAccess_requestRecordingAccess;
}

export interface RequestRecordingAccessVariables {
  recordingId: string;
}
