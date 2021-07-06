import { MockedResponse } from "@apollo/client/testing";
import { GET_USER_SETTINGS } from "ui/graphql/settings";

export function createUserSettingsMock(): MockedResponse {
  return {
    request: {
      query: GET_USER_SETTINGS,
    },
    result: {
      data: {
        viewer: {
          settings: {
            showElements: false,
            showReact: false,
            enableTeams: true,
            enableRepaint: false,
          },
          defaultWorkspace: null,
        },
      },
    },
  };
}
