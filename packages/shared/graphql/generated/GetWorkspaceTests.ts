/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetWorkspaceTests
// ====================================================

export interface GetWorkspaceTests_node_Recording {
  __typename: "Recording" | "RootCauseAnalysis";
}

export interface GetWorkspaceTests_node_Workspace_tests_edges_node_stats {
  __typename: "TestsStats";
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  unknown: number;
  failureRate: number;
}

export interface GetWorkspaceTests_node_Workspace_tests_edges_node {
  __typename: "Tests";
  testId: string;
  title: string;
  scope: string[];
  stats: GetWorkspaceTests_node_Workspace_tests_edges_node_stats;
}

export interface GetWorkspaceTests_node_Workspace_tests_edges {
  __typename: "TestsEdge";
  node: GetWorkspaceTests_node_Workspace_tests_edges_node;
}

export interface GetWorkspaceTests_node_Workspace_tests {
  __typename: "TestsConnection";
  edges: GetWorkspaceTests_node_Workspace_tests_edges[];
}

export interface GetWorkspaceTests_node_Workspace {
  __typename: "Workspace";
  id: string;
  tests: GetWorkspaceTests_node_Workspace_tests | null;
}

export type GetWorkspaceTests_node = GetWorkspaceTests_node_Recording | GetWorkspaceTests_node_Workspace;

export interface GetWorkspaceTests {
  node: GetWorkspaceTests_node | null;
}

export interface GetWorkspaceTestsVariables {
  workspaceId: string;
}
