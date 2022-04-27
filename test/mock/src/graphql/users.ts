import { MockedResponse } from "@apollo/client/testing";
import { DismissNag, DismissNagVariables } from "graphql/DismissNag";
import { GetUser } from "graphql/GetUser";
import { GetUserId } from "graphql/GetUserId";
import { GET_USER_INFO, GET_USER_ID, DISMISS_NAG } from "ui/graphql/users";

import { cloneResponse } from "./utils";

type DismissNagType = {
  request: {
    query: typeof DISMISS_NAG;
    variables: DismissNagVariables;
  };
  result: {
    data: DismissNag;
  };
};

type GetUserType = {
  request: {
    query: typeof GET_USER_INFO;
  };
  result: {
    data: GetUser;
  };
};

type GetUserIdType = {
  request: {
    query: typeof GET_USER_ID;
  };
  result: {
    data: GetUserId;
  };
};

export function createGetUserMock(opts: { user?: { id: string; uuid: string } }): MockedResponse[] {
  const userId = opts.user?.id || "mock-user";

  const getUser: GetUserType = {
    request: {
      query: GET_USER_INFO,
    },
    result: {
      data: {
        viewer: {
          __typename: "AuthenticatedUser",
          acceptedTOSVersion: null,
          email: "mock@user.io",
          features: {
            __typename: "AuthenticatedUserFeatures",
            library: false,
          },
          internal: false,
          motd: null,
          nags: [],
          unsubscribedEmailTypes: [],
          user: {
            __typename: "User",
            id: userId,
            name: null,
            picture: null,
          },
        },
      },
    },
  };

  const dismissNag: DismissNagType = {
    request: {
      query: DISMISS_NAG,
      variables: { nag: "first_log_in" },
    },
    result: {
      data: {
        dismissNag: {
          __typename: "DismissNag",
          success: true,
        },
      },
    },
  };

  const getUserId: GetUserIdType = {
    request: {
      query: GET_USER_ID,
    },
    result: {
      data: {
        viewer: {
          __typename: "AuthenticatedUser",
          user: {
            __typename: "User",
            id: userId,
          },
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
