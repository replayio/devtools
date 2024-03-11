/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetWorkspaceTestExecutions
// ====================================================

export interface GetWorkspaceTestExecutions_node_Recording {
  __typename: "Recording" | "RootCauseAnalysis";
}

export interface GetWorkspaceTestExecutions_node_Workspace_tests_edges_node_executions_recordings {
  __typename: "Recording";
  id: string;
  uuid: any;
  title: string | null;
  isProcessed: boolean | null;
  duration: number | null;
  createdAt: any;
}

export interface GetWorkspaceTestExecutions_node_Workspace_tests_edges_node_executions {
  __typename: "TestExecution";
  errors: string[] | null;
  createdAt: any;
  commitTitle: string | null;
  result: string;
  recordings: GetWorkspaceTestExecutions_node_Workspace_tests_edges_node_executions_recordings[];
}

export interface GetWorkspaceTestExecutions_node_Workspace_tests_edges_node {
  __typename: "Tests";
  testId: string;
  title: string;
  scope: string[];
  executions: GetWorkspaceTestExecutions_node_Workspace_tests_edges_node_executions[];
}

export interface GetWorkspaceTestExecutions_node_Workspace_tests_edges {
  __typename: "TestsEdge";
  node: GetWorkspaceTestExecutions_node_Workspace_tests_edges_node;
}

export interface GetWorkspaceTestExecutions_node_Workspace_tests {
  __typename: "TestsConnection";
  edges: GetWorkspaceTestExecutions_node_Workspace_tests_edges[];
}

export interface GetWorkspaceTestExecutions_node_Workspace {
  __typename: "Workspace";
  id: string;
  tests: GetWorkspaceTestExecutions_node_Workspace_tests | null;
}

export type GetWorkspaceTestExecutions_node = GetWorkspaceTestExecutions_node_Recording | GetWorkspaceTestExecutions_node_Workspace;

export interface GetWorkspaceTestExecutions {
  node: GetWorkspaceTestExecutions_node | null;
}

export interface GetWorkspaceTestExecutionsVariables {
  workspaceId: string;
  testId?: string | null;
}
