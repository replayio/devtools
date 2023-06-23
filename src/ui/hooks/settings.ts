import { DocumentNode, gql, useMutation, useQuery } from "@apollo/client";
import { useEffect, useMemo, useState } from "react";

import Services from "devtools/shared/services";
import {
  CreateUserAPIKey,
  CreateUserAPIKeyVariables,
} from "shared/graphql/generated/CreateUserAPIKey";
import {
  DeleteUserAPIKey,
  DeleteUserAPIKeyVariables,
} from "shared/graphql/generated/DeleteUserAPIKey";
import { GetUserSettings } from "shared/graphql/generated/GetUserSettings";
import {
  UpdateUserDefaultWorkspace,
  UpdateUserDefaultWorkspaceVariables,
} from "shared/graphql/generated/UpdateUserDefaultWorkspace";
import {
  UpdateUserPreferences,
  UpdateUserPreferencesVariables,
} from "shared/graphql/generated/UpdateUserPreferences";
import type { ApiKey, ExperimentalUserSettings } from "shared/graphql/types";
import {
  ADD_USER_API_KEY,
  DELETE_USER_API_KEY,
  GET_USER_SETTINGS,
  UPDATE_USER_PREFERENCES,
} from "ui/graphql/settings";
import { query } from "ui/utils/apolloClient";
import { isTest } from "ui/utils/environment";
import { maybeTrackTeamChange } from "ui/utils/mixpanel";
import { features, prefs } from "ui/utils/prefs";
import useAuth0 from "ui/utils/useAuth0";

const { prefs: prefsService } = Services;

const emptySettings: ExperimentalUserSettings = {
  apiKeys: [],
  defaultWorkspaceId: null,
  disableLogRocket: false,
  role: "developer",
};

const testSettings: ExperimentalUserSettings = {
  apiKeys: [],
  defaultWorkspaceId: null,
  disableLogRocket: false,
  role: "developer",
};

export async function getUserSettings(): Promise<ExperimentalUserSettings> {
  const result = await query<GetUserSettings>({ query: GET_USER_SETTINGS });

  if (isTest()) {
    return testSettings;
  }

  return convertUserSettings(result.data);
}

export function useGetUserSettings() {
  const { isAuthenticated } = useAuth0();
  const { data, error, loading } = useQuery<GetUserSettings>(GET_USER_SETTINGS);

  const userSettings = useMemo(() => convertUserSettings(data), [data]);

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

  return { userSettings, error, loading };
}

const runtimeFeatureOverrides = (() => {
  if (typeof window === "undefined") {
    return [];
  }

  const query = new URLSearchParams(window.location.search);
  return query.get("features")?.split(",") || [];
})();

const getFullKey = (prefKey: keyof typeof features) => `devtools.features.${prefKey}`;

export const getFeature = (prefKey: keyof typeof features): boolean => {
  if (runtimeFeatureOverrides.includes(prefKey)) {
    return true;
  }

  return prefsService.getBoolPref(getFullKey(prefKey));
};

export const useFeature = (prefKey: keyof typeof features) => {
  const fullKey = getFullKey(prefKey);
  const [pref, setPref] = useState(getFeature(prefKey));

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
      if (runtimeFeatureOverrides.includes(prefKey)) {
        console.warn(`${prefKey} is force-enabled by a run-time override`);
      } else {
        prefsService.setBoolPref(fullKey, newValue);
      }
    },
  };
};

export const useStringPref = (prefKey: keyof typeof prefs) => {
  const fullKey = `devtools.${prefKey}`;
  const [pref, setPref] = useState(prefsService.getStringPref(fullKey));

  const updateValue = useMemo(
    () => (newValue: string) => prefsService.setStringPref(fullKey, newValue),
    [fullKey]
  );

  useEffect(() => {
    const onUpdate = (prefs: any) => {
      setPref(prefs.getStringPref(fullKey));
    };

    prefsService.addObserver(fullKey, onUpdate, false);
    return () => prefsService.removeObserver(fullKey, onUpdate);
  }, [fullKey]);

  return {
    value: pref,
    update: updateValue,
  };
};

export const useBoolPref = (prefKey: keyof typeof prefs) => {
  const fullKey = `devtools.${prefKey}`;
  const [pref, setPref] = useState(prefsService.getBoolPref(fullKey));

  const updateValue = useMemo(
    () => (newValue: boolean) => prefsService.setBoolPref(fullKey, newValue),
    [fullKey]
  );

  useEffect(() => {
    const onUpdate = (prefs: any) => {
      setPref(prefs.getBoolPref(fullKey));
    };

    prefsService.addObserver(fullKey, onUpdate, false);
    return () => prefsService.removeObserver(fullKey, onUpdate);
  }, [fullKey]);

  return {
    value: pref,
    update: updateValue,
  };
};

function convertUserSettings(data: GetUserSettings | undefined): ExperimentalUserSettings {
  if (!data?.viewer) {
    return emptySettings;
  }

  const preferences = data.viewer.preferences;
  return {
    apiKeys: data.viewer.apiKeys as ApiKey[],
    defaultWorkspaceId: data.viewer.defaultWorkspace?.id || null,
    disableLogRocket: preferences.disableLogRocket ?? false,
    role: preferences.role ?? "developer",
  };
}

export function useUpdateUserPreferences() {
  const [updateUserPreferences, { loading, error }] = useMutation<
    UpdateUserPreferences,
    UpdateUserPreferencesVariables
  >(UPDATE_USER_PREFERENCES, { refetchQueries: ["GetUserSettings"] });

  return { updateUserPreferences, loading, error };
}

export function useUpdateDefaultWorkspace() {
  const [updateUserSetting, { error }] = useMutation<
    UpdateUserDefaultWorkspace,
    UpdateUserDefaultWorkspaceVariables
  >(
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
  const [addUserApiKey, { loading, error }] = useMutation<
    CreateUserAPIKey,
    CreateUserAPIKeyVariables
  >(ADD_USER_API_KEY, {
    refetchQueries: ["GetUserSettings"],
  });

  return { addUserApiKey, loading, error };
}

export function useDeleteUserApiKey() {
  const [deleteUserApiKey, { loading, error }] = useMutation<
    DeleteUserAPIKey,
    DeleteUserAPIKeyVariables
  >(DELETE_USER_API_KEY, {
    refetchQueries: ["GetUserSettings"],
  });

  return { deleteUserApiKey, loading, error };
}
