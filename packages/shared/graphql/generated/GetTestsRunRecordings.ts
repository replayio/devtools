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

export interface GetTestsRunRecordings_node_Workspace_testRuns_edges_node_tests_recordings_comments_user {
  __typename: "User";
  id: string;
}

export interface GetTestsRunRecordings_node_Workspace_testRuns_edges_node_tests_recordings_comments {
  __typename: "Comment";
  user: GetTestsRunRecordings_node_Workspace_testRuns_edges_node_tests_recordings_comments_user | null;
}

export interface GetTestsRunRecordings_node_Workspace_testRuns_edges_node_tests_recordings {
  __typename: "Recording";
  uuid: any;
  duration: number | null;
  isProcessed: boolean | null;
  createdAt: any;
  comments: GetTestsRunRecordings_node_Workspace_testRuns_edges_node_tests_recordings_comments[];
}

export interface GetTestsRunRecordings_node_Workspace_testRuns_edges_node_tests {
  __typename: "TestRunTest";
  testId: string;
  sourcePath: string;
  title: string;
  recordings: GetTestsRunRecordings_node_Workspace_testRuns_edges_node_tests_recordings[];
}

export interface GetTestsRunRecordings_node_Workspace_testRuns_edges_node {
  __typename: "TestRun";
  tests: GetTestsRunRecordings_node_Workspace_testRuns_edges_node_tests[];
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
