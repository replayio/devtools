/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetTestsRuns
// ====================================================

export interface GetTestsRuns_node_Recording {
  __typename: "Recording";
}

export interface GetTestsRuns_node_Workspace_testRuns_edges_node_results_counts {
  __typename: "TestRunStats";
  failed: number;
  flaky: number;
  passed: number;
}

export interface GetTestsRuns_node_Workspace_testRuns_edges_node_results {
  __typename: "TestRunResults";
  counts: GetTestsRuns_node_Workspace_testRuns_edges_node_results_counts;
}

export interface GetTestsRuns_node_Workspace_testRuns_edges_node_source {
  __typename: "TestRunSource";
  commitId: string;
  commitTitle: string | null;
  groupLabel: string | null;
  isPrimaryBranch: boolean;
  branchName: string | null;
  prNumber: number | null;
  prTitle: string | null;
  repository: string | null;
  triggerUrl: string | null;
  user: string | null;
}

export interface GetTestsRuns_node_Workspace_testRuns_edges_node {
  __typename: "TestRun";
  id: string;
  date: any;
  mode: string | null;
  results: GetTestsRuns_node_Workspace_testRuns_edges_node_results;
  source: GetTestsRuns_node_Workspace_testRuns_edges_node_source | null;
}

export interface GetTestsRuns_node_Workspace_testRuns_edges {
  __typename: "TestRunEdge";
  node: GetTestsRuns_node_Workspace_testRuns_edges_node;
}

export interface GetTestsRuns_node_Workspace_testRuns {
  __typename: "TestRunConnection";
  edges: GetTestsRuns_node_Workspace_testRuns_edges[];
}

export interface GetTestsRuns_node_Workspace {
  __typename: "Workspace";
  id: string;
  testRuns: GetTestsRuns_node_Workspace_testRuns | null;
}

export type GetTestsRuns_node = GetTestsRuns_node_Recording | GetTestsRuns_node_Workspace;

export interface GetTestsRuns {
  node: GetTestsRuns_node | null;
}

export interface GetTestsRunsVariables {
  workspaceId: string;
}
