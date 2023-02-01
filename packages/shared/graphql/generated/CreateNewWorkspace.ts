/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CreateNewWorkspace
// ====================================================

export interface CreateNewWorkspace_createWorkspace_workspace {
  __typename: "Workspace";
  id: string;
  invitationCode: string | null;
  domain: string | null;
  isDomainLimitedCode: boolean | null;
}

export interface CreateNewWorkspace_createWorkspace {
  __typename: "CreateWorkspace";
  success: boolean | null;
  workspace: CreateNewWorkspace_createWorkspace_workspace | null;
}

export interface CreateNewWorkspace {
  createWorkspace: CreateNewWorkspace_createWorkspace;
}

export interface CreateNewWorkspaceVariables {
  name: string;
  planKey: string;
}
