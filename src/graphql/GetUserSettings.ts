/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetUserSettings
// ====================================================

export interface GetUserSettings_viewer_apiKeys {
  __typename: "AuthenticatedUserAPIKey";
  id: string;
  createdAt: any;
  label: string;
  scopes: string[];
  recordingCount: number;
  maxRecordings: number | null;
}

export interface GetUserSettings_viewer_settings {
  __typename: "AuthenticatedUserSettings";
  disableLogRocket: boolean;
  enableEventLink: boolean;
  enableRepaint: boolean;
  enableTeams: boolean;
  showReact: boolean;
}

export interface GetUserSettings_viewer_defaultWorkspace {
  __typename: "Workspace";
  id: string;
}

export interface GetUserSettings_viewer {
  __typename: "AuthenticatedUser";
  apiKeys: GetUserSettings_viewer_apiKeys[];
  settings: GetUserSettings_viewer_settings;
  defaultWorkspace: GetUserSettings_viewer_defaultWorkspace | null;
}

export interface GetUserSettings {
  viewer: GetUserSettings_viewer | null;
}
