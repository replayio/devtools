/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SetRecordingIsPrivate
// ====================================================

export interface SetRecordingIsPrivate_updateRecordingPrivacy {
  __typename: "UpdateRecordingPrivacy";
  success: boolean | null;
}

export interface SetRecordingIsPrivate {
  updateRecordingPrivacy: SetRecordingIsPrivate_updateRecordingPrivacy;
}

export interface SetRecordingIsPrivateVariables {
  recordingId: string;
  isPrivate: boolean;
}
