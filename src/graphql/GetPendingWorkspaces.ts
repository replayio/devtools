/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetPendingWorkspaces
// ====================================================

export interface GetPendingWorkspaces_viewer_workspaceInvitations_edges_node_workspace {
  __typename: "Workspace";
  id: string;
  name: string;
  recordingCount: number;
  isOrganization: boolean;
}

export interface GetPendingWorkspaces_viewer_workspaceInvitations_edges_node {
  __typename: "WorkspaceInvitation";
  workspace: GetPendingWorkspaces_viewer_workspaceInvitations_edges_node_workspace;
  inviterEmail: string | null;
}

export interface GetPendingWorkspaces_viewer_workspaceInvitations_edges {
  __typename: "UserWorkspaceInvitationEdge";
  node: GetPendingWorkspaces_viewer_workspaceInvitations_edges_node;
}

export interface GetPendingWorkspaces_viewer_workspaceInvitations {
  __typename: "UserWorkspaceInvitationConnection";
  edges: GetPendingWorkspaces_viewer_workspaceInvitations_edges[];
}

export interface GetPendingWorkspaces_viewer {
  __typename: "AuthenticatedUser";
  workspaceInvitations: GetPendingWorkspaces_viewer_workspaceInvitations;
}

export interface GetPendingWorkspaces {
  viewer: GetPendingWorkspaces_viewer | null;
}
