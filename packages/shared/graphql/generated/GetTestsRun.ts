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

export interface GetTestsRun_node_Workspace_testRuns_edges_node_tests_recordings_comments_user {
  __typename: "User";
  id: string;
}

export interface GetTestsRun_node_Workspace_testRuns_edges_node_tests_recordings_comments {
  __typename: "Comment";
  user: GetTestsRun_node_Workspace_testRuns_edges_node_tests_recordings_comments_user | null;
}

export interface GetTestsRun_node_Workspace_testRuns_edges_node_tests_recordings {
  __typename: "Recording";
  uuid: any;
  duration: number | null;
  isProcessed: boolean | null;
  createdAt: any;
  comments: GetTestsRun_node_Workspace_testRuns_edges_node_tests_recordings_comments[];
}

export interface GetTestsRun_node_Workspace_testRuns_edges_node_tests {
  __typename: "TestRunTest";
  testId: string;
  sourcePath: string;
  title: string;
  recordings: GetTestsRun_node_Workspace_testRuns_edges_node_tests_recordings[];
}

export interface GetTestsRun_node_Workspace_testRuns_edges_node {
  __typename: "TestRun";
  tests: GetTestsRun_node_Workspace_testRuns_edges_node_tests[];
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
