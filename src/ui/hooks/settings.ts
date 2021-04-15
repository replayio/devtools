import { useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { SettingItemKey } from "ui/components/shared/SettingsModal/types";
import useAuth0 from "ui/utils/useAuth0";

const anonymousSettings = {
  show_elements: false,
  show_react: false,
};

export function useGetUserSettings() {
  const { isAuthenticated } = useAuth0();
  const [mutationSent, setMutationSent] = useState(false);
  const addUserSettings = useAddUserSettings();

  if (!isAuthenticated) {
    return { userSettings: anonymousSettings, loading: false };
  }

  const { data, error, loading } = useQuery(
    gql`
      query GetUserSettings {
        user_settings {
          show_elements
          show_react
          enable_teams
          default_workspace_id
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

  // This is for cases where the user doesn't have a record in the user_settings table.
  // This inserts the user into the table here and have the Hasura fill in the default settings.
  // After, the GetUserSettings query is refetched to get the newly added user's settings.
  // Note that we check that the mutation is only called once, otherwise subsequent mutations will
  // throw an error.
  if (data.user_settings.length == 0 && !mutationSent) {
    setMutationSent(true);
    addUserSettings();
  }

  const userSettings = data?.user_settings?.[0];
  return { userSettings, error, loading };
}

export function useAddUserSettings() {
  const [addUserSettings] = useMutation(
    gql`
      mutation AddUserSettings {
        insert_user_settings_one(object: {}) {
          user_id
        }
      }
    `,
    { refetchQueries: ["GetUserSettings"] }
  );

  return addUserSettings;
}

export function useUpdateUserSetting(key: SettingItemKey, type: "uuid" | "Boolean") {
  const [updateUserSetting, { error }] = useMutation(
    gql`
      mutation UpdateCommentContent($newValue: ${type}, $userId: uuid!) {
        update_user_settings(
          _set: { ${key}: $newValue },
          where: {user_id: {_eq: $userId}}
        ) {
          returning {
            user_id
            ${key}
          }
        }
      }
    `,
    { refetchQueries: ["GetUserSettings"] }
  );

  if (error) {
    console.error("Apollo error while updating a comment:", error);
  }

  return updateUserSetting;
}
