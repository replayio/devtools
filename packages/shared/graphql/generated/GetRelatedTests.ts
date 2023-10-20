/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetRelatedTests
// ====================================================

export interface GetRelatedTests_node_Recording {
  __typename: "Recording";
}

export interface GetRelatedTests_node_Workspace_relatedTests_edges_node_tests_recording {
  __typename: "Recording";
  id: string;
  title: string | null;
  createdAt: any;
}

export interface GetRelatedTests_node_Workspace_relatedTests_edges_node_tests {
  __typename: "RelatedTest";
  title: string;
  runTitle: string | null;
  commitTitle: string | null;
  recordingId: string;
  result: string;
  recording: GetRelatedTests_node_Workspace_relatedTests_edges_node_tests_recording | null;
}

export interface GetRelatedTests_node_Workspace_relatedTests_edges_node {
  __typename: "TestsQuery";
  testId: string;
  title: string;
  tests: GetRelatedTests_node_Workspace_relatedTests_edges_node_tests[];
}

export interface GetRelatedTests_node_Workspace_relatedTests_edges {
  __typename: "RelatedTestsEdge";
  node: GetRelatedTests_node_Workspace_relatedTests_edges_node;
}

export interface GetRelatedTests_node_Workspace_relatedTests {
  __typename: "RelatedTestsConnection";
  edges: GetRelatedTests_node_Workspace_relatedTests_edges[];
}

export interface GetRelatedTests_node_Workspace {
  __typename: "Workspace";
  id: string;
  relatedTests: GetRelatedTests_node_Workspace_relatedTests | null;
}

export type GetRelatedTests_node = GetRelatedTests_node_Recording | GetRelatedTests_node_Workspace;

export interface GetRelatedTests {
  node: GetRelatedTests_node | null;
}

export interface GetRelatedTestsVariables {
  workspaceId: string;
}
