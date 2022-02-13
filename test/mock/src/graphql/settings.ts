import { MockedResponse } from "@apollo/client/testing";
import { GET_USER_SETTINGS } from "ui/graphql/settings";
import { UserSettings } from "ui/types";
import { cloneResponse } from "./utils";

export function createUserSettingsMock(): MockedResponse[] {
  const settings: UserSettings = {
    apiKeys: [],
    defaultWorkspaceId: null,
    disableLogRocket: false,
    enableEventLink: false,
    enableTeams: true,
    showReact: true,
  };
  const rv = {
    request: {
      query: GET_USER_SETTINGS,
    },
    result: {
      data: {
        viewer: {
          apiKeys: [],
          settings,
          defaultWorkspace: null,
        },
      },
    },
  };
  return cloneResponse(rv, 10);
}
