/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateUserSettingsTeams
// ====================================================

export interface UpdateUserSettingsTeams_updateUserSettings {
  __typename: "UpdateUserSettings";
  success: boolean | null;
}

export interface UpdateUserSettingsTeams {
  updateUserSettings: UpdateUserSettingsTeams_updateUserSettings;
}

export interface UpdateUserSettingsTeamsVariables {
  newValue?: boolean | null;
}
