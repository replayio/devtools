/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateUserSettingsRole
// ====================================================

export interface UpdateUserSettingsRole_updateUserSettings {
  __typename: "UpdateUserSettings";
  success: boolean | null;
}

export interface UpdateUserSettingsRole {
  updateUserSettings: UpdateUserSettingsRole_updateUserSettings;
}

export interface UpdateUserSettingsRoleVariables {
  role?: string | null;
}
