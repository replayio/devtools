/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetPoints
// ====================================================

export interface GetPoints_recording_points_user {
  __typename: "User";
  id: string;
  name: string | null;
  picture: string | null;
}

export interface GetPoints_recording_points {
  __typename: "Point";
  badge: string | null;
  column: number;
  condition: string | null;
  content: string;
  createdAt: any;
  key: string;
  line: number;
  sourceId: string;
  user: GetPoints_recording_points_user | null;
}

export interface GetPoints_recording {
  __typename: "Recording";
  uuid: any;
  points: GetPoints_recording_points[];
}

export interface GetPoints {
  recording: GetPoints_recording | null;
}

export interface GetPointsVariables {
  recordingId: any;
}
