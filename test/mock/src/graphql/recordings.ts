import { MockedResponse } from "@apollo/client/testing";
import { GetRecording, GetRecordingVariables, GetRecording_recording } from "graphql/GetRecording";
import {
  GetRecordingUserId,
  GetRecordingUserIdVariables,
  GetRecordingUserId_recording,
} from "graphql/GetRecordingUserId";
import { GET_RECORDING, GET_RECORDING_USER_ID } from "ui/graphql/recordings";
import { Recording, RecordingRole, User } from "ui/types";

import { cloneResponse } from "./utils";

type GetRecordingUserIdMockType = {
  request: {
    query: typeof GET_RECORDING_USER_ID;
    variables: GetRecordingUserIdVariables;
  };
  result: {
    data: GetRecordingUserId;
  };
};

export function createRecordingOwnerUserIdMock(opts: {
  recordingId: string;
  user?: { id: string; uuid: string };
}): MockedResponse[] {
  let mockRecording: GetRecordingUserId_recording | null = null;
  if (opts.user) {
    mockRecording = {
      __typename: "Recording",
      owner: {
        __typename: "User",
        id: opts.user.id,
      },
      uuid: opts.recordingId,
    };
  }

  const mock: GetRecordingUserIdMockType = {
    request: {
      query: GET_RECORDING_USER_ID,
      variables: { recordingId: opts.recordingId },
    },
    result: {
      data: {
        recording: mockRecording,
      },
    },
  };
  return cloneResponse(mock, 100);
}

type GetRecordingMockType = {
  request: {
    query: typeof GET_RECORDING;
    variables: GetRecordingVariables;
  };
  result: {
    data: GetRecording;
  };
};

export function createGetRecordingMock(opts: {
  recordingId: string;
  recording?: Partial<Recording>;
  user?: Partial<User>;
}): MockedResponse[] {
  let mockRecording: GetRecording_recording = {
    __typename: "Recording",
    collaboratorRequests: null as any, // TypeScript fail
    collaborators: null as any, // TypeScript fail
    comments: [],
    createdAt: "2021-07-05T10:03:13.466Z",
    duration: 10,
    isInitialized: true,
    operations: { scriptDomains: [] },
    owner: {
      __typename: "User",
      id: "mock-user-id",
      internal: false,
      name: "Mock User",
      picture: "",

      ...opts.user,
    },
    ownerNeedsInvite: false,
    private: false,
    resolution: null,
    title: "Mock Title",
    url: "https://mock.org",
    userRole: RecordingRole.None,
    uuid: opts.recordingId || "mock-recording-id",
    workspace: null as any, // TypeScript fail

    ...opts.recording,
  };

  const mock: GetRecordingMockType = {
    request: {
      query: GET_RECORDING,
      variables: { recordingId: opts.recordingId },
    },
    result: {
      data: {
        recording: opts.recording ? mockRecording : null,
      },
    },
  };
  return cloneResponse(mock, 100);
}
