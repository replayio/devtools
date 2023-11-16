/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetTestForWorkspace
// ====================================================

export interface GetTestForWorkspace_node_Recording {
  __typename: "Recording";
}

export interface GetTestForWorkspace_node_Workspace_tests_edges_node_executions_recording {
  __typename: "Recording";
  uuid: any;
  title: string | null;
}

export interface GetTestForWorkspace_node_Workspace_tests_edges_node_executions {
  __typename: "TestExecution";
  errors: string[] | null;
  createdAt: any;
  commitTitle: string | null;
  result: string;
  recording: (GetTestForWorkspace_node_Workspace_tests_edges_node_executions_recording | null)[];
}

export interface GetTestForWorkspace_node_Workspace_tests_edges_node {
  __typename: "Tests";
  testId: string;
  title: string;
  scope: string[];
  executions: GetTestForWorkspace_node_Workspace_tests_edges_node_executions[];
}

export interface GetTestForWorkspace_node_Workspace_tests_edges {
  __typename: "TestsEdge";
  node: GetTestForWorkspace_node_Workspace_tests_edges_node;
}

export interface GetTestForWorkspace_node_Workspace_tests {
  __typename: "TestsConnection";
  edges: GetTestForWorkspace_node_Workspace_tests_edges[];
}

export interface GetTestForWorkspace_node_Workspace {
  __typename: "Workspace";
  id: string;
  tests: GetTestForWorkspace_node_Workspace_tests | null;
}

export type GetTestForWorkspace_node = GetTestForWorkspace_node_Recording | GetTestForWorkspace_node_Workspace;

export interface GetTestForWorkspace {
  node: GetTestForWorkspace_node | null;
}

export interface GetTestForWorkspaceVariables {
  workspaceId: string;
  testId?: string | null;
}
