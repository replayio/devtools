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

export interface GetTestsRunsForWorkspace_node_Workspace_testRuns_stats {
  __typename: "TestRunStats";
  passed: number | null;
  failed: number | null;
  flaky: number | null;
}

export interface GetTestsRunsForWorkspace_node_Workspace_testRuns {
  __typename: "TestRun";
  id: string | null;
  title: string | null;
  branch: string | null;
  commitId: string | null;
  commitTitle: string | null;
  mergeId: string | null;
  mergeTitle: string | null;
  repository: string | null;
  user: string | null;
  date: any | null;
  mode: string | null;
  stats: GetTestsRunsForWorkspace_node_Workspace_testRuns_stats | null;
}

export interface GetTestsRunsForWorkspace_node_Workspace {
  __typename: "Workspace";
  id: string;
  testRuns: GetTestsRunsForWorkspace_node_Workspace_testRuns[] | null;
}

export type GetTestsRunsForWorkspace_node =
  | GetTestsRunsForWorkspace_node_Recording
  | GetTestsRunsForWorkspace_node_Workspace;

export interface GetTestsRunsForWorkspace {
  node: GetTestsRunsForWorkspace_node | null;
}

export interface GetTestsRunsForWorkspaceVariables {
  workspaceId: string;
}
