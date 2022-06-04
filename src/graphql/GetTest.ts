/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetTest
// ====================================================

export interface GetTest_test_recordings_edges_node {
  __typename: "Recording";
  uuid: any;
  duration: number | null;
  createdAt: any;
  metadata: any | null;
}

export interface GetTest_test_recordings_edges {
  __typename: "TestRecordingEdge";
  node: GetTest_test_recordings_edges_node;
}

export interface GetTest_test_recordings {
  __typename: "TestRecordingConnection";
  edges: GetTest_test_recordings_edges[];
}

export interface GetTest_test {
  __typename: "Test";
  title: string | null;
  path: string[] | null;
  recordings: GetTest_test_recordings | null;
}

export interface GetTest {
  test: GetTest_test | null;
}

export interface GetTestVariables {
  path: string;
}
