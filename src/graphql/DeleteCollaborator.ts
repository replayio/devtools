/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteCollaborator
// ====================================================

export interface DeleteCollaborator_removeRecordingCollaborator {
  __typename: "RemoveRecordingCollaborator";
  success: boolean | null;
}

export interface DeleteCollaborator {
  removeRecordingCollaborator: DeleteCollaborator_removeRecordingCollaborator;
}

export interface DeleteCollaboratorVariables {
  collaborationId: string;
}
