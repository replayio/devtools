/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateRecordingResolution
// ====================================================

export interface UpdateRecordingResolution_updateRecordingResolution {
  __typename: "UpdateRecordingResolution";
  success: boolean | null;
}

export interface UpdateRecordingResolution {
  updateRecordingResolution: UpdateRecordingResolution_updateRecordingResolution;
}

export interface UpdateRecordingResolutionVariables {
  id: string;
  isResolved: boolean;
}
