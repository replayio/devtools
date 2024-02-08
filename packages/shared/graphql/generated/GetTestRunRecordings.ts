/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetTestRunRecordings
// ====================================================

export interface GetTestRunRecordings_node_Recording {
  __typename: "Recording";
}

export interface GetTestRunRecordings_node_Workspace_testRuns_edges_node_results_counts {
  __typename: "TestRunStats";
  failed: number;
  flaky: number;
  passed: number;
}

export interface GetTestRunRecordings_node_Workspace_testRuns_edges_node_results {
  __typename: "TestRunResults";
  counts: GetTestRunRecordings_node_Workspace_testRuns_edges_node_results_counts;
}

export interface GetTestRunRecordings_node_Workspace_testRuns_edges_node_source {
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

export interface GetTestRunRecordings_node_Workspace_testRuns_edges_node_tests_executions_recordings_comments_user {
  __typename: "User";
  id: string;
}

export interface GetTestRunRecordings_node_Workspace_testRuns_edges_node_tests_executions_recordings_comments {
  __typename: "Comment";
  user: GetTestRunRecordings_node_Workspace_testRuns_edges_node_tests_executions_recordings_comments_user | null;
}

export interface GetTestRunRecordings_node_Workspace_testRuns_edges_node_tests_executions_recordings {
  __typename: "Recording";
  uuid: any;
  duration: number | null;
  isProcessed: boolean | null;
  createdAt: any;
  comments: GetTestRunRecordings_node_Workspace_testRuns_edges_node_tests_executions_recordings_comments[];
}

export interface GetTestRunRecordings_node_Workspace_testRuns_edges_node_tests_executions {
  __typename: "TestRunTestExecution";
  result: string;
  recordings: GetTestRunRecordings_node_Workspace_testRuns_edges_node_tests_executions_recordings[];
}

export interface GetTestRunRecordings_node_Workspace_testRuns_edges_node_tests {
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
  executions: GetTestRunRecordings_node_Workspace_testRuns_edges_node_tests_executions[];
}

export interface GetTestRunRecordings_node_Workspace_testRuns_edges_node {
  __typename: "TestRun";
  id: string;
  date: any;
  mode: string | null;
  results: GetTestRunRecordings_node_Workspace_testRuns_edges_node_results;
  source: GetTestRunRecordings_node_Workspace_testRuns_edges_node_source;
  tests: GetTestRunRecordings_node_Workspace_testRuns_edges_node_tests[];
}

export interface GetTestRunRecordings_node_Workspace_testRuns_edges {
  __typename: "TestRunEdge";
  node: GetTestRunRecordings_node_Workspace_testRuns_edges_node;
}

export interface GetTestRunRecordings_node_Workspace_testRuns {
  __typename: "TestRunConnection";
  edges: GetTestRunRecordings_node_Workspace_testRuns_edges[];
}

export interface GetTestRunRecordings_node_Workspace {
  __typename: "Workspace";
  id: string;
  testRuns: GetTestRunRecordings_node_Workspace_testRuns | null;
}

export type GetTestRunRecordings_node = GetTestRunRecordings_node_Recording | GetTestRunRecordings_node_Workspace;

export interface GetTestRunRecordings {
  node: GetTestRunRecordings_node | null;
}

export interface GetTestRunRecordingsVariables {
  workspaceId: string;
  id: string;
}