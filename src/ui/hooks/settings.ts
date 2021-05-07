import { gql } from "@apollo/client";
import { query, mutate } from "ui/utils/apolloClient";
import { anonymousSettings } from "ui/reducers/app";

export async function getUserSettings() {
  const result = await query({
    query: gql`
      query GetUserSettings {
        viewer {
          settings {
            showElements
            showReact
            enableTeams
            enableRepaint
          }
          defaultWorkspace {
            id
          }
        }
      }
    `,
    variables: {},
  });

  if (result.data?.viewer) {
    const settings = result.data.viewer.settings;
    return {
      showElements: settings.showElements,
      showReact: settings.showReact,
      enableTeams: settings.enableTeams,
      enableRepaint: settings.enableRepaint,
      defaultWorkspaceId: result.data.viewer.defaultWorkspace?.id || null,
    };
  } else {
    return anonymousSettings;
  }
}

export function updateUserSetting(key: string, value: boolean) {
  return mutate({
    mutation: gql`
      mutation UpdateUserSettings($value: Boolean!) {
        updateUserSettings(
          input: { ${key}: $value },
        ) {
          success
        }
      }
    `,
    variables: { value },
  });
}

export function updateDefaultWorkspace(workspaceId: string | null) {
  return mutate({
    mutation: gql`
      mutation UpdateUserDefaultWorkspace($workspaceId: ID) {
        updateUserDefaultWorkspace(input: { workspaceId: $workspaceId }) {
          success
        }
      }
    `,
    variables: { workspaceId },
  });
}
