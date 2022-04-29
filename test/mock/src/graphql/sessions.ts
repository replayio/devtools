import { MockedResponse } from "@apollo/client/testing";
import { GetActiveSessions, GetActiveSessionsVariables } from "graphql/GetActiveSessions";
import { GET_ACTIVE_SESSIONS } from "ui/graphql/sessions";

import { cloneResponse } from "./utils";

type GetActiveSessionsType = {
  request: {
    query: typeof GET_ACTIVE_SESSIONS;
    variables: GetActiveSessionsVariables;
  };
  result: {
    data: GetActiveSessions;
  };
};

export function createGetActiveSessionsMock(opts: { recordingId: string }): MockedResponse[] {
  const mock: GetActiveSessionsType = {
    request: {
      query: GET_ACTIVE_SESSIONS,
      variables: { recordingId: opts.recordingId },
    },
    result: {
      data: {
        recording: {
          __typename: "Recording",
          activeSessions: [],
          uuid: opts.recordingId,
        },
      },
    },
  };
  return cloneResponse(mock, 20);
}
