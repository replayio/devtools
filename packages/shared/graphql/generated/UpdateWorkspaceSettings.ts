/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateWorkspaceSettings
// ====================================================

export interface UpdateWorkspaceSettings_updateWorkspaceSettings {
  __typename: "UpdateWorkspaceSettings";
  success: boolean | null;
}

export interface UpdateWorkspaceSettings {
  updateWorkspaceSettings: UpdateWorkspaceSettings_updateWorkspaceSettings;
}

export interface UpdateWorkspaceSettingsVariables {
  workspaceId: string;
  name?: string | null;
  motd?: string | null;
  features?: any | null;
}
