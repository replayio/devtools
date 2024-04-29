import { gql, useMutation, useQuery } from "@apollo/client";

import { query } from "shared/graphql/apolloClient";
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
import { UserSettings } from "shared/graphql/types";
import { isTest } from "shared/utils/environment";
import { ADD_USER_API_KEY, DELETE_USER_API_KEY, GET_USER_SETTINGS } from "ui/graphql/settings";
import { getAccessToken } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";
import { maybeTrackTeamChange } from "ui/utils/mixpanel";

const emptySettings: UserSettings = {
  apiKeys: [],
  defaultWorkspaceId: null,
};

const testSettings: UserSettings = {
  apiKeys: [],
  defaultWorkspaceId: null,
};

export async function getUserSettings(): Promise<UserSettings> {
  const result = await query<GetUserSettings>({ query: GET_USER_SETTINGS });

  if (isTest()) {
    return testSettings;
  }

  let apiKeys = [] as any[];
  let defaultWorkspaceId: string | null = null;

  if (result.data.viewer) {
    apiKeys = result.data.viewer.apiKeys;
    defaultWorkspaceId = result.data.viewer.defaultWorkspace?.id ?? null;
  }

  return {
    apiKeys,
    defaultWorkspaceId,
  };
}

export function useGetUserSettings() {
  const isAuthenticated = !!useAppSelector(getAccessToken);
  const { data: userSettings, error, loading } = useQuery<GetUserSettings>(GET_USER_SETTINGS);

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

  let apiKeys = [] as any[];
  let defaultWorkspaceId: string | null = null;

  if (userSettings?.viewer) {
    apiKeys = userSettings.viewer.apiKeys;
    defaultWorkspaceId = userSettings.viewer.defaultWorkspace?.id ?? null;
  }

  return {
    error,
    loading,
    userSettings: {
      apiKeys,
      defaultWorkspaceId,
    },
  };
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
