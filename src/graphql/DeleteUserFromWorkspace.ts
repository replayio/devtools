/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteUserFromWorkspace
// ====================================================

export interface DeleteUserFromWorkspace_removeWorkspaceMember {
  __typename: "RemoveWorkspaceMember";
  success: boolean | null;
}

export interface DeleteUserFromWorkspace {
  removeWorkspaceMember: DeleteUserFromWorkspace_removeWorkspaceMember;
}

export interface DeleteUserFromWorkspaceVariables {
  membershipId: string;
}
