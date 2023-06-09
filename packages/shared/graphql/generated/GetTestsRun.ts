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

export interface GetTestsRun_node_Workspace_testRuns_stats {
  __typename: "TestRunStats";
  failed: number | null;
  flaky: number | null;
  passed: number | null;
}

export interface GetTestsRun_node_Workspace_testRuns_recordings_edges_node_comments_user {
  __typename: "User";
  id: string;
}

export interface GetTestsRun_node_Workspace_testRuns_recordings_edges_node_comments {
  __typename: "Comment";
  user: GetTestsRun_node_Workspace_testRuns_recordings_edges_node_comments_user | null;
}

export interface GetTestsRun_node_Workspace_testRuns_recordings_edges_node {
  __typename: "Recording";
  uuid: any;
  duration: number | null;
  createdAt: any;
  metadata: any | null;
  comments: GetTestsRun_node_Workspace_testRuns_recordings_edges_node_comments[];
}

export interface GetTestsRun_node_Workspace_testRuns_recordings_edges {
  __typename: "TestRunRecordingEdge";
  node: GetTestsRun_node_Workspace_testRuns_recordings_edges_node;
}

export interface GetTestsRun_node_Workspace_testRuns_recordings {
  __typename: "TestRunRecordingConnection";
  edges: GetTestsRun_node_Workspace_testRuns_recordings_edges[];
}

export interface GetTestsRun_node_Workspace_testRuns {
  __typename: "TestRun";
  id: string | null;
  title: string | null;
  branch: string | null;
  commitId: string | null;
  commitTitle: string | null;
  mergeId: string | null;
  mergeTitle: string | null;
  mode: string | null;
  repository: string | null;
  user: string | null;
  date: any | null;
  stats: GetTestsRun_node_Workspace_testRuns_stats | null;
  recordings: GetTestsRun_node_Workspace_testRuns_recordings | null;
}

export interface GetTestsRun_node_Workspace {
  __typename: "Workspace";
  id: string;
  testRuns: GetTestsRun_node_Workspace_testRuns[] | null;
}

export type GetTestsRun_node = GetTestsRun_node_Recording | GetTestsRun_node_Workspace;

export interface GetTestsRun {
  node: GetTestsRun_node | null;
}

export interface GetTestsRunVariables {
  workspaceId: string;
  id: string;
}
