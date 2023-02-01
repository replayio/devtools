/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteRecording
// ====================================================

export interface DeleteRecording_deleteRecording {
  __typename: "DeleteRecording";
  success: boolean | null;
}

export interface DeleteRecording {
  deleteRecording: DeleteRecording_deleteRecording;
}

export interface DeleteRecordingVariables {
  recordingId: string;
}
