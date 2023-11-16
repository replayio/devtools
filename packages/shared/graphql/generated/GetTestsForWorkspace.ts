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

export interface GetTestsForWorkspace_node_Workspace_tests_edges_node {
  __typename: "Tests";
  testId: string;
  title: string;
  scope: string[];
}

export interface GetTestsForWorkspace_node_Workspace_tests_edges {
  __typename: "TestsEdge";
  node: GetTestsForWorkspace_node_Workspace_tests_edges_node;
}

export interface GetTestsForWorkspace_node_Workspace_tests {
  __typename: "TestsConnection";
  edges: GetTestsForWorkspace_node_Workspace_tests_edges[];
}

export interface GetTestsForWorkspace_node_Workspace {
  __typename: "Workspace";
  id: string;
  tests: GetTestsForWorkspace_node_Workspace_tests | null;
}

export type GetTestsForWorkspace_node = GetTestsForWorkspace_node_Recording | GetTestsForWorkspace_node_Workspace;

export interface GetTestsForWorkspace {
  node: GetTestsForWorkspace_node | null;
}

export interface GetTestsForWorkspaceVariables {
  workspaceId: string;
}
