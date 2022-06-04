/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetTest
// ====================================================

export interface GetTest_node_Recording {
  __typename: "Recording";
}

export interface GetTest_node_Workspace_tests_recordings_edges_node {
  __typename: "Recording";
  uuid: any;
  duration: number | null;
  createdAt: any;
  metadata: any | null;
}

export interface GetTest_node_Workspace_tests_recordings_edges {
  __typename: "TestRecordingEdge";
  node: GetTest_node_Workspace_tests_recordings_edges_node;
}

export interface GetTest_node_Workspace_tests_recordings {
  __typename: "TestRecordingConnection";
  edges: GetTest_node_Workspace_tests_recordings_edges[];
}

export interface GetTest_node_Workspace_tests {
  __typename: "Test";
  title: string | null;
  path: string[] | null;
  recordings: GetTest_node_Workspace_tests_recordings | null;
}

export interface GetTest_node_Workspace {
  __typename: "Workspace";
  id: string;
  tests: GetTest_node_Workspace_tests[] | null;
}

export type GetTest_node = GetTest_node_Recording | GetTest_node_Workspace;

export interface GetTest {
  node: GetTest_node | null;
}

export interface GetTestVariables {
  workspaceId: string;
  path: string;
}
