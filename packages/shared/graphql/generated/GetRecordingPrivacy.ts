/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetRecordingPrivacy
// ====================================================

export interface GetRecordingPrivacy_recording {
  __typename: "Recording";
  uuid: any;
  private: boolean;
}

export interface GetRecordingPrivacy {
  recording: GetRecordingPrivacy_recording | null;
}

export interface GetRecordingPrivacyVariables {
  recordingId: any;
}
