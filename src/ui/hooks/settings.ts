const Services = require("devtools/shared/services");
import { gql, useQuery, useMutation } from "@apollo/client";
import { mutate, query } from "ui/utils/apolloClient";
import { isTest } from "ui/utils/environment";
import { SettingItemKey } from "ui/components/shared/SettingsModal/types";
import useAuth0 from "ui/utils/useAuth0";
import type { UserSettings } from "../types";
import { ADD_USER_API_KEY, DELETE_USER_API_KEY, GET_USER_SETTINGS } from "ui/graphql/settings";
import { features } from "ui/utils/prefs";
import { prefs as prefsService } from "devtools/shared/services";
import { useEffect, useState } from "react";
import { maybeTrackTeamChange } from "ui/utils/mixpanel";

const emptySettings: UserSettings = {
  apiKeys: [],
  defaultWorkspaceId: null,
  disableLogRocket: false,
  enableEventLink: false,
  enableTeams: true,
  showReact: false,
  defaultToDevtools: false,
};

const testSettings: UserSettings = {
  apiKeys: [],
  defaultWorkspaceId: null,
  disableLogRocket: false,
  enableEventLink: false,
  enableTeams: true,
  showReact: true,
  defaultToDevtools: false,
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

export const useFeature = (prefKey: keyof typeof features) => {
  const fullKey = `devtools.features.${prefKey}`;
  const [pref, setPref] = useState(prefsService.getBoolPref(fullKey));

  useEffect(() => {
    const onUpdate = (prefs: any) => {
      setPref(prefs.getBoolPref(fullKey));
    };

    prefsService.addObserver(fullKey, onUpdate, false);
    return () => prefsService.removeObserver(fullKey, onUpdate);
  }, [fullKey]);

  return {
    value: pref,
    update: (newValue: boolean) => {
      prefsService.setBoolPref(fullKey, newValue);
    },
  };
};

function convertUserSettings(data: any): UserSettings {
  if (!data?.viewer) {
    return emptySettings;
  }

  const settings = data.viewer.settings;
  return {
    apiKeys: data.viewer.apiKeys,
    defaultWorkspaceId: data.viewer.defaultWorkspace?.id || null,
    disableLogRocket: settings.disableLogRocket,
    enableEventLink: settings.enableEventLink,
    enableTeams: settings.enableTeams,
    showReact: settings.showReact,
    defaultToDevtools: settings.defaultToDevtools,
  };
}

function getUpdateUserSettingQuery(key: SettingItemKey, type: "uuid" | "Boolean") {
  return gql`
    mutation UpdateUserSettings($newValue: ${type}) {
      updateUserSettings(
        input: { ${key}: $newValue },
      ) {
        success
      }
    }
  `;
}

export function useUpdateUserSetting(key: SettingItemKey, type: "uuid" | "Boolean") {
  const [updateUserSetting, { error }] = useMutation(getUpdateUserSettingQuery(key, type), {
    refetchQueries: ["GetUserSettings"],
  });

  if (error) {
    console.error("Apollo error while updating a user setting:", error);
  }

  return updateUserSetting;
}

export async function migratePrefToSettings(prefKey: string, settingKey: SettingItemKey) {
  if (Services.prefs.prefHasUserValue(prefKey)) {
    const newValue = Services.prefs.getBoolPref(prefKey);
    await mutate({
      mutation: getUpdateUserSettingQuery(settingKey, "Boolean"),
      variables: {
        newValue,
      },
    });
    Services.prefs.clearUserPref(prefKey);
  }
}

export function useUpdateDefaultWorkspace() {
  const [updateUserSetting, { error }] = useMutation(
    gql`
      mutation UpdateUserDefaultWorkspace($workspaceId: ID) {
        updateUserDefaultWorkspace(input: { workspaceId: $workspaceId }) {
          success
          workspace {
            id
          }
        }
      }
    `,
    {
      refetchQueries: ["GetUserSettings"],
      onCompleted: data => {
        const { workspace } = data.updateUserDefaultWorkspace;

        // The workspace will be non-existent if it's just been set to
        // null (My Library).
        if (!workspace) {
          return maybeTrackTeamChange(null);
        }

        maybeTrackTeamChange(workspace.id);
      },
    }
  );

  if (error) {
    console.error("Apollo error while updating a user setting:", error);
  }

  return updateUserSetting;
}

export function useAddUserApiKey() {
  const [addUserApiKey, { loading, error }] = useMutation(ADD_USER_API_KEY, {
    refetchQueries: ["GetUserSettings"],
  });

  return { addUserApiKey, loading, error };
}

export function useDeleteUserApiKey() {
  const [deleteUserApiKey, { loading, error }] = useMutation(DELETE_USER_API_KEY, {
    refetchQueries: ["GetUserSettings"],
  });

  return { deleteUserApiKey, loading, error };
}
