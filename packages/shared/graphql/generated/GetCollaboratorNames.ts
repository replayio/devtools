/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetCollaboratorNames
// ====================================================

export interface GetCollaboratorNames_recording_owner {
  __typename: "User";
  id: string;
  name: string | null;
}

export interface GetCollaboratorNames_recording_collaborators_edges_node_RecordingPendingEmailCollaborator {
  __typename: "RecordingPendingEmailCollaborator" | "RecordingPendingUserCollaborator";
}

export interface GetCollaboratorNames_recording_collaborators_edges_node_RecordingUserCollaborator_user {
  __typename: "User";
  id: string;
  name: string | null;
}

export interface GetCollaboratorNames_recording_collaborators_edges_node_RecordingUserCollaborator {
  __typename: "RecordingUserCollaborator";
  user: GetCollaboratorNames_recording_collaborators_edges_node_RecordingUserCollaborator_user;
}

export type GetCollaboratorNames_recording_collaborators_edges_node = GetCollaboratorNames_recording_collaborators_edges_node_RecordingPendingEmailCollaborator | GetCollaboratorNames_recording_collaborators_edges_node_RecordingUserCollaborator;

export interface GetCollaboratorNames_recording_collaborators_edges {
  __typename: "RecordingCollaboratorsEdge";
  node: GetCollaboratorNames_recording_collaborators_edges_node;
}

export interface GetCollaboratorNames_recording_collaborators {
  __typename: "RecordingCollaboratorsConnection";
  edges: GetCollaboratorNames_recording_collaborators_edges[];
}

export interface GetCollaboratorNames_recording_workspace_members_edges_node_user {
  __typename: "User";
  id: string;
  name: string | null;
}

export interface GetCollaboratorNames_recording_workspace_members_edges_node {
  __typename: "WorkspaceUserMember";
  user: GetCollaboratorNames_recording_workspace_members_edges_node_user;
}

export interface GetCollaboratorNames_recording_workspace_members_edges {
  __typename: "WorkspaceMemberEdge";
  node: GetCollaboratorNames_recording_workspace_members_edges_node;
}

export interface GetCollaboratorNames_recording_workspace_members {
  __typename: "WorkspaceMemberConnection";
  edges: GetCollaboratorNames_recording_workspace_members_edges[];
}

export interface GetCollaboratorNames_recording_workspace {
  __typename: "Workspace";
  id: string;
  members: GetCollaboratorNames_recording_workspace_members | null;
}

export interface GetCollaboratorNames_recording {
  __typename: "Recording";
  id: string;
  uuid: any;
  owner: GetCollaboratorNames_recording_owner | null;
  collaborators: GetCollaboratorNames_recording_collaborators | null;
  workspace: GetCollaboratorNames_recording_workspace | null;
}

export interface GetCollaboratorNames {
  recording: GetCollaboratorNames_recording | null;
}

export interface GetCollaboratorNamesVariables {
  recordingId: any;
}
