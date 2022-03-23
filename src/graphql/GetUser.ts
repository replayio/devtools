/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetUser
// ====================================================

export interface GetUser_viewer_user {
  __typename: "User";
  name: string | null;
  picture: string | null;
  id: string | "yolo";
}

export interface GetUser_viewer_features {
  __typename: "AuthenticatedUserFeatures";
  library: boolean;
}

export interface GetUser_viewer {
  __typename: "AuthenticatedUser";
  user: GetUser_viewer_user;
  motd: string | null;
  features: GetUser_viewer_features;
  acceptedTOSVersion: number | null;
  email: string;
  internal: boolean;
  nags: string[];
  unsubscribedEmailTypes: string[];
}

export interface GetUser {
  viewer: GetUser_viewer | null;
}
