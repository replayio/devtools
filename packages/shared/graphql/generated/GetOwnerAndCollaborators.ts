/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetOwnerAndCollaborators
// ====================================================

export interface GetOwnerAndCollaborators_recording_owner {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
}

export interface GetOwnerAndCollaborators_recording_collaborators_edges_node_RecordingPendingEmailCollaborator {
  __typename: "RecordingPendingEmailCollaborator";
  id: string;
  email: string;
  createdAt: any;
}

export interface GetOwnerAndCollaborators_recording_collaborators_edges_node_RecordingPendingUserCollaborator_user {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
}

export interface GetOwnerAndCollaborators_recording_collaborators_edges_node_RecordingPendingUserCollaborator {
  __typename: "RecordingPendingUserCollaborator";
  id: string;
  createdAt: any;
  user: GetOwnerAndCollaborators_recording_collaborators_edges_node_RecordingPendingUserCollaborator_user;
}

export interface GetOwnerAndCollaborators_recording_collaborators_edges_node_RecordingUserCollaborator_user {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
}

export interface GetOwnerAndCollaborators_recording_collaborators_edges_node_RecordingUserCollaborator {
  __typename: "RecordingUserCollaborator";
  id: string;
  createdAt: any;
  user: GetOwnerAndCollaborators_recording_collaborators_edges_node_RecordingUserCollaborator_user;
}

export type GetOwnerAndCollaborators_recording_collaborators_edges_node = GetOwnerAndCollaborators_recording_collaborators_edges_node_RecordingPendingEmailCollaborator | GetOwnerAndCollaborators_recording_collaborators_edges_node_RecordingPendingUserCollaborator | GetOwnerAndCollaborators_recording_collaborators_edges_node_RecordingUserCollaborator;

export interface GetOwnerAndCollaborators_recording_collaborators_edges {
  __typename: "RecordingCollaboratorsEdge";
  node: GetOwnerAndCollaborators_recording_collaborators_edges_node;
}

export interface GetOwnerAndCollaborators_recording_collaborators {
  __typename: "RecordingCollaboratorsConnection";
  edges: GetOwnerAndCollaborators_recording_collaborators_edges[];
}

export interface GetOwnerAndCollaborators_recording {
  __typename: "Recording";
  uuid: any;
  owner: GetOwnerAndCollaborators_recording_owner | null;
  collaborators: GetOwnerAndCollaborators_recording_collaborators | null;
}

export interface GetOwnerAndCollaborators {
  recording: GetOwnerAndCollaborators_recording | null;
}

export interface GetOwnerAndCollaboratorsVariables {
  recordingId: any;
}
