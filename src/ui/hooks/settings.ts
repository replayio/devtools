import { gql, useQuery, useMutation } from "@apollo/client";
import { query } from "ui/utils/apolloClient";
import { isTest } from "ui/utils/environment";
import { SettingItemKey } from "ui/components/shared/SettingsModal/types";
import useAuth0 from "ui/utils/useAuth0";
import type { UserSettings } from "../types";
import { GET_USER_SETTINGS } from "ui/graphql/settings";

const emptySettings: UserSettings = {
  showElements: false,
  showReact: false,
  enableTeams: true,
  enableRepaint: false,
  defaultWorkspaceId: null,
};

const testSettings: UserSettings = {
  showElements: true,
  showReact: true,
  enableTeams: true,
  enableRepaint: false,
  defaultWorkspaceId: null,
};

export async function getUserSettings(): Promise<UserSettings> {
  const result = await query({ query: GET_USER_SETTINGS, variables: {} });

  if (isTest()) {
    return testSettings;
  }

  return convertUserSettings(result.data);
}

export function useGetUserSettings() {
  const { isAuthenticated } = useAuth0();
  const { data, error, loading } = useQuery(GET_USER_SETTINGS);

  if (isTest()) {
    return { userSettings: testSettings, loading: false };
  }

  if (!isAuthenticated) {
    return { userSettings: emptySettings, loading: false };
  }

  if (loading) {
    return { userSettings: emptySettings, error, loading };
  }

  if (error) {
    console.error("Apollo error while getting user settings:", error);
    return { userSettings: emptySettings, error, loading };
  }

  return { userSettings: convertUserSettings(data), error, loading };
}

function convertUserSettings(data: any): UserSettings {
  if (!data?.viewer) {
    return emptySettings;
  }

  const settings = data.viewer.settings;
  return {
    showElements: settings.showElements,
    showReact: settings.showReact,
    enableTeams: settings.enableTeams,
    enableRepaint: settings.enableRepaint,
    defaultWorkspaceId: data.viewer.defaultWorkspace?.id || null,
  };
}

export function useUpdateUserSetting(key: SettingItemKey, type: "uuid" | "Boolean") {
  const [updateUserSetting, { error }] = useMutation(
    gql`
      mutation UpdateUserSettings($newValue: ${type}) {
        updateUserSettings(
          input: { ${key}: $newValue },
        ) {
          success
        }
      }
    `,
    { refetchQueries: ["GetUserSettings"] }
  );

  if (error) {
    console.error("Apollo error while updating a user setting:", error);
  }

  return updateUserSetting;
}

export function useUpdateDefaultWorkspace() {
  const [updateUserSetting, { error }] = useMutation(
    gql`
      mutation UpdateUserDefaultWorkspace($workspaceId: ID) {
        updateUserDefaultWorkspace(input: { workspaceId: $workspaceId }) {
          success
        }
      }
    `,
    { refetchQueries: ["GetUserSettings"] }
  );

  if (error) {
    console.error("Apollo error while updating a user setting:", error);
  }

  return updateUserSetting;
}
