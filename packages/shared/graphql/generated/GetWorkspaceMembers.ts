/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetWorkspaceMembers
// ====================================================

export interface GetWorkspaceMembers_node_Recording {
  __typename: "Recording" | "RootCauseAnalysis";
}

export interface GetWorkspaceMembers_node_Workspace_members_edges_node_WorkspacePendingEmailMember {
  __typename: "WorkspacePendingEmailMember" | "WorkspacePendingUserMember";
}

export interface GetWorkspaceMembers_node_Workspace_members_edges_node_WorkspaceUserMember_user {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
}

export interface GetWorkspaceMembers_node_Workspace_members_edges_node_WorkspaceUserMember {
  __typename: "WorkspaceUserMember";
  id: string;
  roles: string[];
  user: GetWorkspaceMembers_node_Workspace_members_edges_node_WorkspaceUserMember_user;
}

export type GetWorkspaceMembers_node_Workspace_members_edges_node = GetWorkspaceMembers_node_Workspace_members_edges_node_WorkspacePendingEmailMember | GetWorkspaceMembers_node_Workspace_members_edges_node_WorkspaceUserMember;

export interface GetWorkspaceMembers_node_Workspace_members_edges {
  __typename: "WorkspaceMemberEdge";
  node: GetWorkspaceMembers_node_Workspace_members_edges_node;
}

export interface GetWorkspaceMembers_node_Workspace_members {
  __typename: "WorkspaceMemberConnection";
  edges: GetWorkspaceMembers_node_Workspace_members_edges[];
}

export interface GetWorkspaceMembers_node_Workspace {
  __typename: "Workspace";
  id: string;
  members: GetWorkspaceMembers_node_Workspace_members | null;
}

export type GetWorkspaceMembers_node = GetWorkspaceMembers_node_Recording | GetWorkspaceMembers_node_Workspace;

export interface GetWorkspaceMembers {
  node: GetWorkspaceMembers_node | null;
}

export interface GetWorkspaceMembersVariables {
  workspaceId: string;
}
