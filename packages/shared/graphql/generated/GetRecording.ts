/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetRecording
// ====================================================

export interface GetRecording_recording_testRun {
  __typename: "TestRun";
  id: string;
}

export interface GetRecording_recording_comments_user {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
}

export interface GetRecording_recording_comments_replies_user {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
}

export interface GetRecording_recording_comments_replies {
  __typename: "CommentReply";
  id: string;
  isPublished: boolean | null;
  content: string;
  createdAt: any;
  updatedAt: any;
  user: GetRecording_recording_comments_replies_user | null;
}

export interface GetRecording_recording_comments {
  __typename: "Comment";
  id: string;
  isPublished: boolean | null;
  content: string;
  createdAt: any;
  updatedAt: any;
  hasFrames: boolean;
  time: number;
  point: string;
  user: GetRecording_recording_comments_user | null;
  replies: GetRecording_recording_comments_replies[];
}

export interface GetRecording_recording_activeSessions_user {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
}

export interface GetRecording_recording_activeSessions {
  __typename: "ActiveSession";
  id: string;
  user: GetRecording_recording_activeSessions_user | null;
}

export interface GetRecording_recording_owner {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
  internal: boolean;
}

export interface GetRecording_recording_workspace_subscription {
  __typename: "WorkspaceSubscription";
  status: string | null;
  trialEnds: any | null;
  effectiveUntil: any | null;
}

export interface GetRecording_recording_workspace {
  __typename: "Workspace";
  id: string;
  name: string;
  hasPaymentMethod: boolean;
  isTest: boolean;
  subscription: GetRecording_recording_workspace_subscription | null;
}

export interface GetRecording_recording_collaborators_edges_node_RecordingPendingEmailCollaborator {
  __typename: "RecordingPendingEmailCollaborator" | "RecordingPendingUserCollaborator";
}

export interface GetRecording_recording_collaborators_edges_node_RecordingUserCollaborator_user {
  __typename: "User";
  id: string;
}

export interface GetRecording_recording_collaborators_edges_node_RecordingUserCollaborator {
  __typename: "RecordingUserCollaborator";
  id: string;
  user: GetRecording_recording_collaborators_edges_node_RecordingUserCollaborator_user;
}

export type GetRecording_recording_collaborators_edges_node = GetRecording_recording_collaborators_edges_node_RecordingPendingEmailCollaborator | GetRecording_recording_collaborators_edges_node_RecordingUserCollaborator;

export interface GetRecording_recording_collaborators_edges {
  __typename: "RecordingCollaboratorsEdge";
  node: GetRecording_recording_collaborators_edges_node;
}

export interface GetRecording_recording_collaborators {
  __typename: "RecordingCollaboratorsConnection";
  edges: GetRecording_recording_collaborators_edges[];
}

export interface GetRecording_recording_collaboratorRequests_edges_node_user {
  __typename: "User";
  name: string | null;
  picture: string | null;
}

export interface GetRecording_recording_collaboratorRequests_edges_node {
  __typename: "RecordingCollaboratorRequest";
  id: string;
  user: GetRecording_recording_collaboratorRequests_edges_node_user;
}

export interface GetRecording_recording_collaboratorRequests_edges {
  __typename: "RecordingCollaboratorRequestsEdge";
  node: GetRecording_recording_collaboratorRequests_edges_node;
}

export interface GetRecording_recording_collaboratorRequests {
  __typename: "RecordingCollaboratorRequestsConnection";
  edges: GetRecording_recording_collaboratorRequests_edges[];
}

export interface GetRecording_recording {
  __typename: "Recording";
  uuid: any;
  url: string | null;
  title: string | null;
  duration: number | null;
  createdAt: any;
  private: boolean;
  isInitialized: boolean;
  ownerNeedsInvite: boolean;
  userRole: string;
  operations: any | null;
  resolution: any | null;
  metadata: any | null;
  isTest: boolean;
  isProcessed: boolean | null;
  isInTestWorkspace: boolean;
  testRun: GetRecording_recording_testRun | null;
  comments: GetRecording_recording_comments[];
  activeSessions: GetRecording_recording_activeSessions[] | null;
  owner: GetRecording_recording_owner | null;
  workspace: GetRecording_recording_workspace | null;
  collaborators: GetRecording_recording_collaborators | null;
  collaboratorRequests: GetRecording_recording_collaboratorRequests | null;
}

export interface GetRecording {
  recording: GetRecording_recording | null;
}

export interface GetRecordingVariables {
  recordingId: any;
}
