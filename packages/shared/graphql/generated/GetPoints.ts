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
}

export interface GetPoints_recording_points {
  __typename: "Point";
  id: string;
  user: GetPoints_recording_points_user | null;
  badge: string | null;
  condition: string | null;
  content: string;
  createdAt: any;
  location: any;
  shouldBreak: string;
  shouldLog: string;
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
