/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateUserSettingsEventLink
// ====================================================

export interface UpdateUserSettingsEventLink_updateUserSettings {
  __typename: "UpdateUserSettings";
  success: boolean | null;
}

export interface UpdateUserSettingsEventLink {
  updateUserSettings: UpdateUserSettingsEventLink_updateUserSettings;
}

export interface UpdateUserSettingsEventLinkVariables {
  newValue?: boolean | null;
}
