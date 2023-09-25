/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetTestsRun
// ====================================================

export interface GetTestsRun_node_Recording {
  __typename: "Recording";
}

export interface GetTestsRun_node_Workspace_testRuns_edges_node_results_recordings_comments_user {
  __typename: "User";
  id: string;
}

export interface GetTestsRun_node_Workspace_testRuns_edges_node_results_recordings_comments {
  __typename: "Comment";
  user: GetTestsRun_node_Workspace_testRuns_edges_node_results_recordings_comments_user | null;
}

export interface GetTestsRun_node_Workspace_testRuns_edges_node_results_recordings {
  __typename: "Recording";
  uuid: any;
  duration: number | null;
  isProcessed: boolean | null;
  createdAt: any;
  metadata: any | null;
  comments: GetTestsRun_node_Workspace_testRuns_edges_node_results_recordings_comments[];
}

export interface GetTestsRun_node_Workspace_testRuns_edges_node_results {
  __typename: "TestRunResults";
  recordings: GetTestsRun_node_Workspace_testRuns_edges_node_results_recordings[];
}

export interface GetTestsRun_node_Workspace_testRuns_edges_node {
  __typename: "TestRun";
  results: GetTestsRun_node_Workspace_testRuns_edges_node_results;
}

export interface GetTestsRun_node_Workspace_testRuns_edges {
  __typename: "TestRunEdge";
  node: GetTestsRun_node_Workspace_testRuns_edges_node;
}

export interface GetTestsRun_node_Workspace_testRuns {
  __typename: "TestRunConnection";
  edges: GetTestsRun_node_Workspace_testRuns_edges[];
}

export interface GetTestsRun_node_Workspace {
  __typename: "Workspace";
  id: string;
  testRuns: GetTestsRun_node_Workspace_testRuns | null;
}

export type GetTestsRun_node = GetTestsRun_node_Recording | GetTestsRun_node_Workspace;

export interface GetTestsRun {
  node: GetTestsRun_node | null;
}

export interface GetTestsRunVariables {
  workspaceId: string;
  id: string;
}
