/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetWorkspaceRecordings
// ====================================================

export interface GetWorkspaceRecordings_node_Recording {
  __typename: "Recording";
}

export interface GetWorkspaceRecordings_node_Workspace_recordings_edges_node_comments_user {
  __typename: "User";
  id: string;
}

export interface GetWorkspaceRecordings_node_Workspace_recordings_edges_node_comments {
  __typename: "Comment";
  user: GetWorkspaceRecordings_node_Workspace_recordings_edges_node_comments_user | null;
}

export interface GetWorkspaceRecordings_node_Workspace_recordings_edges_node_owner {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
}

export interface GetWorkspaceRecordings_node_Workspace_recordings_edges_node_workspace_subscription {
  __typename: "WorkspaceSubscription";
  status: string | null;
  trialEnds: any | null;
  effectiveUntil: any | null;
}

export interface GetWorkspaceRecordings_node_Workspace_recordings_edges_node_workspace {
  __typename: "Workspace";
  id: string;
  hasPaymentMethod: boolean;
  subscription: GetWorkspaceRecordings_node_Workspace_recordings_edges_node_workspace_subscription | null;
}

export interface GetWorkspaceRecordings_node_Workspace_recordings_edges_node {
  __typename: "Recording";
  uuid: any;
  url: string | null;
  title: string | null;
  duration: number | null;
  createdAt: any;
  private: boolean;
  isInitialized: boolean;
  userRole: string;
  comments: GetWorkspaceRecordings_node_Workspace_recordings_edges_node_comments[];
  owner: GetWorkspaceRecordings_node_Workspace_recordings_edges_node_owner | null;
  workspace: GetWorkspaceRecordings_node_Workspace_recordings_edges_node_workspace | null;
}

export interface GetWorkspaceRecordings_node_Workspace_recordings_edges {
  __typename: "WorkspaceRecordingEdge";
  node: GetWorkspaceRecordings_node_Workspace_recordings_edges_node;
}

export interface GetWorkspaceRecordings_node_Workspace_recordings {
  __typename: "WorkspaceRecordingConnection";
  edges: GetWorkspaceRecordings_node_Workspace_recordings_edges[];
}

export interface GetWorkspaceRecordings_node_Workspace {
  __typename: "Workspace";
  id: string;
  recordings: GetWorkspaceRecordings_node_Workspace_recordings | null;
}

export type GetWorkspaceRecordings_node = GetWorkspaceRecordings_node_Recording | GetWorkspaceRecordings_node_Workspace;

export interface GetWorkspaceRecordings {
  node: GetWorkspaceRecordings_node | null;
}

export interface GetWorkspaceRecordingsVariables {
  workspaceId: string;
}
