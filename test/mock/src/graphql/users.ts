import { MockedResponse } from "@apollo/client/testing";
import { GET_USER_INFO, GET_USER_ID, DISMISS_NAG } from "ui/graphql/users";
import { cloneResponse } from "./utils";

export function createGetUserMock(opts: { user?: { id: string; uuid: string } }): MockedResponse[] {
  const userInfo = {
    acceptedTOSVersion: 1,
    email: "mock@user.io",
    features: {
      library: true,
    },
    id: opts.user?.id || "1",
    internal: false,
    motd: null,
    nags: [],
    unsubscribedEmailTypes: [],
    user: { id: opts.user?.id || "1", picture: null, name: "Mock User" },
  };
  const getUser = {
    request: {
      query: GET_USER_INFO,
    },
    result: {
      data: { viewer: userInfo },
    },
  };
  const dismissNag = {
    request: {
      query: DISMISS_NAG,
      variables: { nag: "first_log_in" },
    },
    result: {
      data: { viewer: {} },
    },
  };
  const getUserId = {
    request: {
      query: GET_USER_ID,
    },
    result: {
      data: {
        viewer: {
          user: opts.user ? { id: opts.user.id } : null,
        },
      },
    },
  };
  return [
    ...cloneResponse(getUser, 8),
    ...cloneResponse(getUserId, 8),
    ...cloneResponse(dismissNag, 8),
  ];
}
