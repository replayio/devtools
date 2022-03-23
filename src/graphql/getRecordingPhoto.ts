/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: getRecordingPhoto
// ====================================================

export interface getRecordingPhoto_recording {
  __typename: "Recording";
  uuid: any;
  thumbnail: string | null;
}

export interface getRecordingPhoto {
  recording: getRecordingPhoto_recording | null;
}

export interface getRecordingPhotoVariables {
  recordingId: any;
}
