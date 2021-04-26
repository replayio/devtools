import { gql, useQuery, useMutation } from "@apollo/client";
import { SettingItemKey } from "ui/components/shared/SettingsModal/types";
import useAuth0 from "ui/utils/useAuth0";

const anonymousSettings = {
  showElements: false,
  showReact: false,
  enableTeams: true,
  defaultWorkspaceId: null,
};

export function useGetUserSettings() {
  const { isAuthenticated } = useAuth0();

  if (!isAuthenticated) {
    return { userSettings: anonymousSettings, loading: false };
  }

  const { data, error, loading } = useQuery(
    gql`
      query GetUserSettings {
        viewer {
          settings {
            showElements
            showReact
            enableTeams
          }
          defaultWorkspace {
            id
          }
        }
      }
    `
  );

  if (loading) {
    return { userSettings: null, error, loading };
  }

  if (error) {
    console.error("Apollo error while getting user settings:", error);
    return { userSettings: null, error, loading };
  }

  let userSettings = anonymousSettings;
  if (data?.viewer) {
    const settings = data.viewer.settings;
    userSettings = {
      showElements: settings.showElements,
      showReact: settings.showReact,
      enableTeams: settings.enableTeams,
      defaultWorkspaceId: data.viewer.defaultWorkspace?.id || null,
    };
  }
  return { userSettings, error, loading };
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
