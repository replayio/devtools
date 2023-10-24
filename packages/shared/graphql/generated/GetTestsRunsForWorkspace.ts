/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetTestsRunsForWorkspace
// ====================================================

export interface GetTestsRunsForWorkspace_node_Recording {
  __typename: "Recording";
}

export interface GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node_tests {
  __typename: "TestRunTest";
  id: string;
  testId: string;
  index: number;
  attempt: number;
  title: string;
  scope: string[];
  sourcePath: string;
  result: string;
  errors: string[] | null;
  durationMs: number;
  recordingIds: string[];
}

export interface GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node {
  __typename: "TestRun";
  id: string;
  date: any;
  mode: string | null;
  tests: GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node_tests[];
}

export interface GetTestsRunsForWorkspace_node_Workspace_testRuns_edges {
  __typename: "TestRunEdge";
  node: GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node;
}

export interface GetTestsRunsForWorkspace_node_Workspace_testRuns {
  __typename: "TestRunConnection";
  edges: GetTestsRunsForWorkspace_node_Workspace_testRuns_edges[];
}

export interface GetTestsRunsForWorkspace_node_Workspace {
  __typename: "Workspace";
  id: string;
  testRuns: GetTestsRunsForWorkspace_node_Workspace_testRuns | null;
}

export type GetTestsRunsForWorkspace_node = GetTestsRunsForWorkspace_node_Recording | GetTestsRunsForWorkspace_node_Workspace;

export interface GetTestsRunsForWorkspace {
  node: GetTestsRunsForWorkspace_node | null;
}

export interface GetTestsRunsForWorkspaceVariables {
  workspaceId: string;
}
