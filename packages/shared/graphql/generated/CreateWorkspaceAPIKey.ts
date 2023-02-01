/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CreateWorkspaceAPIKey
// ====================================================

export interface CreateWorkspaceAPIKey_createWorkspaceAPIKey_key {
  __typename: "WorkspaceAPIKey";
  id: string;
  label: string;
}

export interface CreateWorkspaceAPIKey_createWorkspaceAPIKey {
  __typename: "CreateWorkspaceAPIKey";
  key: CreateWorkspaceAPIKey_createWorkspaceAPIKey_key;
  keyValue: string;
}

export interface CreateWorkspaceAPIKey {
  createWorkspaceAPIKey: CreateWorkspaceAPIKey_createWorkspaceAPIKey;
}

export interface CreateWorkspaceAPIKeyVariables {
  workspaceId: string;
  label: string;
  scopes: string[];
}
