/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateUserSettingsDefaultWorkspace
// ====================================================

export interface UpdateUserSettingsDefaultWorkspace_updateUserSettings {
  __typename: "UpdateUserSettings";
  success: boolean | null;
}

export interface UpdateUserSettingsDefaultWorkspace {
  updateUserSettings: UpdateUserSettingsDefaultWorkspace_updateUserSettings;
}

export interface UpdateUserSettingsDefaultWorkspaceVariables {
  newValue?: any | null;
}
