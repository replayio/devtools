import { MockedResponse } from "@apollo/client/testing";
import { GET_RECORDING, GET_RECORDING_USER_ID } from "ui/graphql/recordings";
import { Recording, RecordingRole, WorkspaceSubscriptionStatus } from "ui/types";

import { cloneResponse } from "./utils";

const mockRecording = {
  collaborators: [],
  comments: [],
  createdAt: "2021-07-05T10:03:13.466Z",
  duration: 10,
  id: "mock-recording-id",
  isInitialized: true,
  operations: { scriptDomains: [] },
  owner: {
    id: "00000000-0000-0000-0000-000000000000",
    internal: false,
    name: "Mock User",
    picture: "",
  },
  ownerNeedsInvite: false,
  private: false,
  title: "Mock Title",
  url: "https://mock.org",
  userRole: RecordingRole.None,
  workspace: null,
};

export function createRecordingOwnerUserIdMock(opts: {
  recordingId: string;
  user?: { id: string; uuid: string };
}): MockedResponse[] {
  const rv = {
    request: {
      query: GET_RECORDING_USER_ID,
      variables: { recordingId: opts.recordingId },
    },
    result: {
      data: opts.user
        ? {
            recording: {
              owner: {
                id: opts.user.id,
              },
              uuid: opts.recordingId,
            },
          }
        : null,
    },
  };
  return cloneResponse(rv, 100);
}

export function createGetRecordingMock(opts: {
  recordingId: string;
  recording?: Partial<Recording>;
}): MockedResponse[] {
  const rv = {
    request: {
      query: GET_RECORDING,
      variables: { recordingId: opts.recordingId },
    },
    result: {
      data: opts.recording
        ? {
            recording: {
              uuid: opts.recordingId,
              ...mockRecording,
              ...opts.recording,
            },
          }
        : null,
    },
  };
  return cloneResponse(rv, 100);
}
