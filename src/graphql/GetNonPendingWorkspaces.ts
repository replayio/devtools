/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetNonPendingWorkspaces
// ====================================================

export interface GetNonPendingWorkspaces_viewer_workspaces_edges_node_subscription_plan {
  __typename: "Plan";
  key: string;
}

export interface GetNonPendingWorkspaces_viewer_workspaces_edges_node_subscription {
  __typename: "WorkspaceSubscription";
  status: string | null;
  trialEnds: any | null;
  effectiveUntil: any | null;
  plan: GetNonPendingWorkspaces_viewer_workspaces_edges_node_subscription_plan | null;
}

export interface GetNonPendingWorkspaces_viewer_workspaces_edges_node_settings {
  __typename: "WorkspaceSettings";
  motd: string | null;
  features: any | null;
}

export interface GetNonPendingWorkspaces_viewer_workspaces_edges_node_members_edges_node_WorkspacePendingEmailMember {
  __typename: "WorkspacePendingEmailMember" | "WorkspacePendingUserMember";
}

export interface GetNonPendingWorkspaces_viewer_workspaces_edges_node_members_edges_node_WorkspaceUserMember_user {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
}

export interface GetNonPendingWorkspaces_viewer_workspaces_edges_node_members_edges_node_WorkspaceUserMember {
  __typename: "WorkspaceUserMember";
  user: GetNonPendingWorkspaces_viewer_workspaces_edges_node_members_edges_node_WorkspaceUserMember_user;
}

export type GetNonPendingWorkspaces_viewer_workspaces_edges_node_members_edges_node = GetNonPendingWorkspaces_viewer_workspaces_edges_node_members_edges_node_WorkspacePendingEmailMember | GetNonPendingWorkspaces_viewer_workspaces_edges_node_members_edges_node_WorkspaceUserMember;

export interface GetNonPendingWorkspaces_viewer_workspaces_edges_node_members_edges {
  __typename: "WorkspaceMemberEdge";
  node: GetNonPendingWorkspaces_viewer_workspaces_edges_node_members_edges_node;
}

export interface GetNonPendingWorkspaces_viewer_workspaces_edges_node_members {
  __typename: "WorkspaceMemberConnection";
  edges: GetNonPendingWorkspaces_viewer_workspaces_edges_node_members_edges[];
}

export interface GetNonPendingWorkspaces_viewer_workspaces_edges_node {
  __typename: "Workspace";
  id: string;
  name: string;
  logo: string | null;
  invitationCode: string | null;
  domain: string | null;
  isDomainLimitedCode: boolean | null;
  hasPaymentMethod: boolean;
  isOrganization: boolean;
  subscription: GetNonPendingWorkspaces_viewer_workspaces_edges_node_subscription | null;
  settings: GetNonPendingWorkspaces_viewer_workspaces_edges_node_settings | null;
  members: GetNonPendingWorkspaces_viewer_workspaces_edges_node_members | null;
}

export interface GetNonPendingWorkspaces_viewer_workspaces_edges {
  __typename: "UserWorkspaceEdge";
  node: GetNonPendingWorkspaces_viewer_workspaces_edges_node;
}

export interface GetNonPendingWorkspaces_viewer_workspaces {
  __typename: "UserWorkspaceConnection";
  edges: GetNonPendingWorkspaces_viewer_workspaces_edges[];
}

export interface GetNonPendingWorkspaces_viewer {
  __typename: "AuthenticatedUser";
  workspaces: GetNonPendingWorkspaces_viewer_workspaces;
}

export interface GetNonPendingWorkspaces {
  viewer: GetNonPendingWorkspaces_viewer | null;
}
