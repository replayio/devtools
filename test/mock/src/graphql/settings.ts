import { MockedResponse } from "@apollo/client/testing";

import { GetUserSettings } from "shared/graphql/generated/GetUserSettings";
import { GET_USER_SETTINGS } from "ui/graphql/settings";

import { cloneResponse } from "./utils";

type GetUserSettingsMockType = {
  request: {
    query: typeof GET_USER_SETTINGS;
  };
  result: {
    data: GetUserSettings;
  };
};

export function createUserSettingsMock(): MockedResponse[] {
  const mockData: GetUserSettings = {
    viewer: {
      __typename: "AuthenticatedUser",
      apiKeys: [],
      defaultWorkspace: null,
      preferences: {
        disableLogRocket: false,
        role: "developer",
      },
    },
  };

  const mock: GetUserSettingsMockType = {
    request: {
      query: GET_USER_SETTINGS,
    },
    result: {
      data: mockData,
    },
  };

  return cloneResponse(mock, 10);
}
