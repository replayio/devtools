/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: AddCollaborator
// ====================================================

export interface AddCollaborator_addRecordingCollaborator {
  __typename: "AddRecordingCollaborator";
  success: boolean | null;
}

export interface AddCollaborator {
  addRecordingCollaborator: AddCollaborator_addRecordingCollaborator;
}

export interface AddCollaboratorVariables {
  email: string;
  recordingId: string;
}
