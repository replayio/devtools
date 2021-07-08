import { MockedResponse } from "@apollo/client/testing";
import { GET_USER_INFO } from "ui/graphql/users";

export function createGetUserMock(opts: {
  user?: { id: string; uuid: string };
}): MockedResponse {
  return {
    request: {
      query: GET_USER_INFO,
    },
    result: {
      data: {
        viewer: {
          user: opts.user ? { id: opts.user.id } : null,
          email: "mock@user.io",
          internal: false,
          nags: [],
          acceptedTOSVersion: 1,
        },
      },
    },
  };
}
