/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetTestRun
// ====================================================

export interface GetTestRun_testRun_recordings_edges_node {
  __typename: "Recording";
  uuid: any;
  duration: number | null;
  createdAt: any;
  metadata: any | null;
}

export interface GetTestRun_testRun_recordings_edges {
  __typename: "TestRunRecordingEdge";
  node: GetTestRun_testRun_recordings_edges_node;
}

export interface GetTestRun_testRun_recordings {
  __typename: "TestRunRecordingConnection";
  edges: GetTestRun_testRun_recordings_edges[];
}

export interface GetTestRun_testRun {
  __typename: "TestRun";
  id: string | null;
  recordings: GetTestRun_testRun_recordings | null;
}

export interface GetTestRun {
  testRun: GetTestRun_testRun | null;
}

export interface GetTestRunVariables {
  id: string;
}
