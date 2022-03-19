/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetMyRecordings
// ====================================================

export interface GetMyRecordings_viewer_recordings_edges_node_owner {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
}

export interface GetMyRecordings_viewer_recordings_edges_node_comments_user {
  __typename: "User";
  id: string;
}

export interface GetMyRecordings_viewer_recordings_edges_node_comments {
  __typename: "Comment";
  user: GetMyRecordings_viewer_recordings_edges_node_comments_user | null;
}

export interface GetMyRecordings_viewer_recordings_edges_node_collaborators_edges_node_RecordingPendingEmailCollaborator {
  __typename: "RecordingPendingEmailCollaborator" | "RecordingPendingUserCollaborator";
}

export interface GetMyRecordings_viewer_recordings_edges_node_collaborators_edges_node_RecordingUserCollaborator_user {
  __typename: "User";
  id: string;
}

export interface GetMyRecordings_viewer_recordings_edges_node_collaborators_edges_node_RecordingUserCollaborator {
  __typename: "RecordingUserCollaborator";
  id: string;
  user: GetMyRecordings_viewer_recordings_edges_node_collaborators_edges_node_RecordingUserCollaborator_user;
}

export type GetMyRecordings_viewer_recordings_edges_node_collaborators_edges_node = GetMyRecordings_viewer_recordings_edges_node_collaborators_edges_node_RecordingPendingEmailCollaborator | GetMyRecordings_viewer_recordings_edges_node_collaborators_edges_node_RecordingUserCollaborator;

export interface GetMyRecordings_viewer_recordings_edges_node_collaborators_edges {
  __typename: "RecordingCollaboratorsEdge";
  node: GetMyRecordings_viewer_recordings_edges_node_collaborators_edges_node;
}

export interface GetMyRecordings_viewer_recordings_edges_node_collaborators {
  __typename: "RecordingCollaboratorsConnection";
  edges: GetMyRecordings_viewer_recordings_edges_node_collaborators_edges[];
}

export interface GetMyRecordings_viewer_recordings_edges_node {
  __typename: "Recording";
  uuid: any;
  url: string | null;
  title: string | null;
  duration: number | null;
  createdAt: any;
  private: boolean;
  isInitialized: boolean;
  userRole: string;
  owner: GetMyRecordings_viewer_recordings_edges_node_owner | null;
  comments: GetMyRecordings_viewer_recordings_edges_node_comments[];
  collaborators: GetMyRecordings_viewer_recordings_edges_node_collaborators | null;
}

export interface GetMyRecordings_viewer_recordings_edges {
  __typename: "UserRecordingEdge";
  node: GetMyRecordings_viewer_recordings_edges_node;
}

export interface GetMyRecordings_viewer_recordings {
  __typename: "UserRecordingConnection";
  edges: GetMyRecordings_viewer_recordings_edges[];
}

export interface GetMyRecordings_viewer {
  __typename: "AuthenticatedUser";
  recordings: GetMyRecordings_viewer_recordings;
}

export interface GetMyRecordings {
  viewer: GetMyRecordings_viewer | null;
}
