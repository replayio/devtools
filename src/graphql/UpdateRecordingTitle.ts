/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateRecordingTitle
// ====================================================

export interface UpdateRecordingTitle_updateRecordingTitle_recording {
  __typename: "Recording";
  uuid: any;
  title: string | null;
}

export interface UpdateRecordingTitle_updateRecordingTitle {
  __typename: "UpdateRecordingTitle";
  success: boolean | null;
  recording: UpdateRecordingTitle_updateRecordingTitle_recording | null;
}

export interface UpdateRecordingTitle {
  updateRecordingTitle: UpdateRecordingTitle_updateRecordingTitle;
}

export interface UpdateRecordingTitleVariables {
  recordingId: string;
  title: string;
}
