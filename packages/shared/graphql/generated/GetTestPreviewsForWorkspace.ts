/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetTestPreviewsForWorkspace
// ====================================================

export interface GetTestPreviewsForWorkspace_node_Recording {
  __typename: "Recording";
}

export interface GetTestPreviewsForWorkspace_node_Workspace_tests_edges_node_stats {
  __typename: "TestsStats";
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  unknown: number;
}

export interface GetTestPreviewsForWorkspace_node_Workspace_tests_edges_node {
  __typename: "Tests";
  testId: string;
  title: string;
  scope: string[];
  stats: GetTestPreviewsForWorkspace_node_Workspace_tests_edges_node_stats;
}

export interface GetTestPreviewsForWorkspace_node_Workspace_tests_edges {
  __typename: "TestsEdge";
  node: GetTestPreviewsForWorkspace_node_Workspace_tests_edges_node;
}

export interface GetTestPreviewsForWorkspace_node_Workspace_tests {
  __typename: "TestsConnection";
  edges: GetTestPreviewsForWorkspace_node_Workspace_tests_edges[];
}

export interface GetTestPreviewsForWorkspace_node_Workspace {
  __typename: "Workspace";
  id: string;
  tests: GetTestPreviewsForWorkspace_node_Workspace_tests | null;
}

export type GetTestPreviewsForWorkspace_node = GetTestPreviewsForWorkspace_node_Recording | GetTestPreviewsForWorkspace_node_Workspace;

export interface GetTestPreviewsForWorkspace {
  node: GetTestPreviewsForWorkspace_node | null;
}

export interface GetTestPreviewsForWorkspaceVariables {
  workspaceId: string;
}
