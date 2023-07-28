/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetTestsRunRecordings
// ====================================================

export interface GetTestsRunRecordings_node_Recording {
  __typename: "Recording";
}

export interface GetTestsRunRecordings_node_Workspace_testRuns_edges_node_results_recordings_comments_user {
  __typename: "User";
  id: string;
}

export interface GetTestsRunRecordings_node_Workspace_testRuns_edges_node_results_recordings_comments {
  __typename: "Comment";
  user: GetTestsRunRecordings_node_Workspace_testRuns_edges_node_results_recordings_comments_user | null;
}

export interface GetTestsRunRecordings_node_Workspace_testRuns_edges_node_results_recordings {
  __typename: "Recording";
  uuid: any;
  duration: number | null;
  isProcessed: boolean;
  createdAt: any;
  metadata: any | null;
  comments: GetTestsRunRecordings_node_Workspace_testRuns_edges_node_results_recordings_comments[];
}

export interface GetTestsRunRecordings_node_Workspace_testRuns_edges_node_results {
  __typename: "TestRunResults";
  recordings: GetTestsRunRecordings_node_Workspace_testRuns_edges_node_results_recordings[];
}

export interface GetTestsRunRecordings_node_Workspace_testRuns_edges_node {
  __typename: "TestRun";
  results: GetTestsRunRecordings_node_Workspace_testRuns_edges_node_results;
}

export interface GetTestsRunRecordings_node_Workspace_testRuns_edges {
  __typename: "TestRunEdge";
  node: GetTestsRunRecordings_node_Workspace_testRuns_edges_node;
}

export interface GetTestsRunRecordings_node_Workspace_testRuns {
  __typename: "TestRunConnection";
  edges: GetTestsRunRecordings_node_Workspace_testRuns_edges[];
}

export interface GetTestsRunRecordings_node_Workspace {
  __typename: "Workspace";
  id: string;
  testRuns: GetTestsRunRecordings_node_Workspace_testRuns | null;
}

export type GetTestsRunRecordings_node = GetTestsRunRecordings_node_Recording | GetTestsRunRecordings_node_Workspace;

export interface GetTestsRunRecordings {
  node: GetTestsRunRecordings_node | null;
}

export interface GetTestsRunRecordingsVariables {
  workspaceId: string;
  id: string;
}
