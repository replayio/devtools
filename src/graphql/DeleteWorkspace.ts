/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteWorkspace
// ====================================================

export interface DeleteWorkspace_deleteWorkspace {
  __typename: "DeleteWorkspace";
  success: boolean | null;
}

export interface DeleteWorkspace {
  deleteWorkspace: DeleteWorkspace_deleteWorkspace;
}

export interface DeleteWorkspaceVariables {
  workspaceId: string;
  shouldDeleteRecordings: boolean;
}
