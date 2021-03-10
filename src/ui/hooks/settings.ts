import { useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";

export function useGetUserSettings() {
  const [mutationSent, setMutationSent] = useState(false);
  const addUserSettings = useAddUserSettings();

  const { data, error, loading } = useQuery(
    gql`
      query GetUserSettings {
        user_settings {
          team_sharing
          show_elements
          private_recordings
        }
      }
    `
  );

  if (loading) {
    return { data, error, loading };
  }

  if (error) {
    console.error("Apollo error while getting user settings:", error);
    return { data, error, loading };
  }

  // Call the mutation for inserting the user's settings once, as subsequent
  // mutations will throw an error.
  if (data.user_settings.length == 0 && !mutationSent) {
    setMutationSent(true);
    addUserSettings();
  }

  return { data, error, loading };
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
