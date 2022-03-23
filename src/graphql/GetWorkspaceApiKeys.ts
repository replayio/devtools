/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetWorkspaceApiKeys
// ====================================================

export interface GetWorkspaceApiKeys_node_Recording {
  __typename: "Recording";
}

export interface GetWorkspaceApiKeys_node_Workspace_apiKeys {
  __typename: "WorkspaceAPIKey";
  id: string;
  createdAt: any;
  label: string;
  scopes: string[];
  recordingCount: number;
  maxRecordings: number | null;
}

export interface GetWorkspaceApiKeys_node_Workspace {
  __typename: "Workspace";
  apiKeys: GetWorkspaceApiKeys_node_Workspace_apiKeys[] | null;
}

export type GetWorkspaceApiKeys_node = GetWorkspaceApiKeys_node_Recording | GetWorkspaceApiKeys_node_Workspace;

export interface GetWorkspaceApiKeys {
  node: GetWorkspaceApiKeys_node | null;
}

export interface GetWorkspaceApiKeysVariables {
  workspaceId: string;
}
