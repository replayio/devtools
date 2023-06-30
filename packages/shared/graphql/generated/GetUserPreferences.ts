/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetUserPreferences
// ====================================================

export interface GetUserPreferences_viewer {
  __typename: "AuthenticatedUser";
  preferences: any;
}

export interface GetUserPreferences {
  viewer: GetUserPreferences_viewer | null;
}
