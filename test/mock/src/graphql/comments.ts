import { MockedResponse } from "@apollo/client/testing";
import { GetComments, GetCommentsVariables } from "graphql/GetComments";
import { GetCommentsTime, GetCommentsTimeVariables } from "graphql/GetCommentsTime";
import { GET_COMMENTS, GET_COMMENTS_TIME } from "ui/graphql/comments";

import { cloneResponse } from "./utils";

type GetCommentsMockType = {
  request: {
    query: typeof GET_COMMENTS;
    variables: GetCommentsVariables;
  };
  result: {
    data: GetComments;
  };
};

type GetCommentsTimeMockType = {
  request: {
    query: typeof GET_COMMENTS_TIME;
    variables: GetCommentsTimeVariables;
  };
  result: {
    data: GetCommentsTime;
  };
};

export function createEmptyCommentsMock(opts: { recordingId: string }): MockedResponse[] {
  const getComments: GetCommentsMockType = {
    request: {
      query: GET_COMMENTS,
      variables: { recordingId: opts.recordingId },
    },
    result: {
      data: {
        recording: {
          __typename: "Recording",
          comments: [],
          uuid: opts.recordingId,
        },
      },
    },
  };
  const getCommentsTime: GetCommentsTimeMockType = {
    request: {
      query: GET_COMMENTS_TIME,
      variables: { recordingId: opts.recordingId },
    },
    result: {
      data: {
        recording: {
          __typename: "Recording",
          comments: [],
          uuid: opts.recordingId,
        },
      },
    },
  };
  return [...cloneResponse(getComments, 5), ...cloneResponse(getCommentsTime, 5)];
}
