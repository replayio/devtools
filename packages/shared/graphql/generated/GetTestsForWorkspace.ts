/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetTestsForWorkspace
// ====================================================

export interface GetTestsForWorkspace_node_Recording {
  __typename: "Recording";
}

export interface GetTestsForWorkspace_node_Workspace_tests_recordings_edges_node {
  __typename: "Recording";
  uuid: any;
  duration: number | null;
  createdAt: any;
  metadata: any | null;
}

export interface GetTestsForWorkspace_node_Workspace_tests_recordings_edges {
  __typename: "TestRecordingEdge";
  node: GetTestsForWorkspace_node_Workspace_tests_recordings_edges_node;
}

export interface GetTestsForWorkspace_node_Workspace_tests_recordings {
  __typename: "TestRecordingConnection";
  edges: GetTestsForWorkspace_node_Workspace_tests_recordings_edges[];
}

export interface GetTestsForWorkspace_node_Workspace_tests {
  __typename: "Test";
  title: string | null;
  path: string[] | null;
  recordings: GetTestsForWorkspace_node_Workspace_tests_recordings | null;
}

export interface GetTestsForWorkspace_node_Workspace {
  __typename: "Workspace";
  id: string;
  tests: GetTestsForWorkspace_node_Workspace_tests[] | null;
}

export type GetTestsForWorkspace_node = GetTestsForWorkspace_node_Recording | GetTestsForWorkspace_node_Workspace;

export interface GetTestsForWorkspace {
  node: GetTestsForWorkspace_node | null;
}

export interface GetTestsForWorkspaceVariables {
  workspaceId: string;
}
