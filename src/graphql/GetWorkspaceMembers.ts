/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetWorkspaceMembers
// ====================================================

export interface GetWorkspaceMembers_node_Recording {
  __typename: "Recording";
}

export interface GetWorkspaceMembers_node_Workspace_members_edges_node_WorkspacePendingEmailMember {
  __typename: "WorkspacePendingEmailMember";
  id: string;
  roles: string[];
  email: string;
  createdAt: any;
}

export interface GetWorkspaceMembers_node_Workspace_members_edges_node_WorkspacePendingUserMember_user {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
}

export interface GetWorkspaceMembers_node_Workspace_members_edges_node_WorkspacePendingUserMember {
  __typename: "WorkspacePendingUserMember";
  id: string;
  roles: string[];
  user: GetWorkspaceMembers_node_Workspace_members_edges_node_WorkspacePendingUserMember_user;
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

export type GetWorkspaceMembers_node_Workspace_members_edges_node = GetWorkspaceMembers_node_Workspace_members_edges_node_WorkspacePendingEmailMember | GetWorkspaceMembers_node_Workspace_members_edges_node_WorkspacePendingUserMember | GetWorkspaceMembers_node_Workspace_members_edges_node_WorkspaceUserMember;

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
