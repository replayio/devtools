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

export interface GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node_results_counts {
  __typename: "TestRunStats";
  failed: number;
  flaky: number;
  passed: number;
}

export interface GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node_results {
  __typename: "TestRunResults";
  counts: GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node_results_counts;
}

export interface GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node_source {
  __typename: "TestRunSource";
  commitId: string | null;
  commitTitle: string | null;
  groupLabel: string | null;
  isPrimaryBranch: boolean | null;
  branchName: string | null;
  prNumber: number | null;
  prTitle: string | null;
  repository: string | null;
  triggerUrl: string | null;
  user: string | null;
}

export interface GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node {
  __typename: "TestRun";
  id: string;
  date: any;
  mode: string | null;
  results: GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node_results;
  source: GetTestsRunsForWorkspace_node_Workspace_testRuns_edges_node_source;
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
  startTime?: string | null;
  endTime?: string | null;
}
