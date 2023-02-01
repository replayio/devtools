/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetUserId
// ====================================================

export interface GetUserId_viewer_user {
  __typename: "User";
  id: string;
}

export interface GetUserId_viewer {
  __typename: "AuthenticatedUser";
  user: GetUserId_viewer_user;
}

export interface GetUserId {
  viewer: GetUserId_viewer | null;
}
