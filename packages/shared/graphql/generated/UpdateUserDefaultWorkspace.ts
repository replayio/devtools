/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateUserDefaultWorkspace
// ====================================================

export interface UpdateUserDefaultWorkspace_updateUserDefaultWorkspace_workspace {
  __typename: "Workspace";
  id: string;
}

export interface UpdateUserDefaultWorkspace_updateUserDefaultWorkspace {
  __typename: "UpdateUserDefaultWorkspace";
  success: boolean | null;
  workspace: UpdateUserDefaultWorkspace_updateUserDefaultWorkspace_workspace | null;
}

export interface UpdateUserDefaultWorkspace {
  updateUserDefaultWorkspace: UpdateUserDefaultWorkspace_updateUserDefaultWorkspace;
}

export interface UpdateUserDefaultWorkspaceVariables {
  workspaceId?: string | null;
}
