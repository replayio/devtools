import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { EventMethods, EventParams } from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";

import { CommandRequest, CommandResponse } from "protocol/socket";
import { UIState } from "ui/state";

export interface Recorded {
  recordedAt: number;
}

type _ProtocolEvent<T extends EventMethods> = { method: T; params: EventParams<T> };
export type ProtocolEvent = _ProtocolEvent<EventMethods>;
export type RequestSummary = Omit<CommandRequest, "method"> & {
  class: string;
  method: string;
  pending: boolean;
  errored: boolean;
  recordedAt: number;
};

export type ProtocolResponse = CommandResponse & Recorded;
export type ProtocolRequest = RequestSummary;
export type ProtocolError = CommandResponse & Recorded;
export type ProtocolResponseMap = { [id: number]: ProtocolResponse };
export type ProtocolRequestMap = { [id: number]: ProtocolRequest };
export type ProtocolErrorMap = { [id: number]: ProtocolError };

export type ReceivedProtocolMessage =
  | {
      type: "request";
      value: ProtocolRequest;
    }
  | {
      type: "response";
      value: ProtocolResponse;
    }
  | {
      type: "error";
      value: ProtocolError;
    };

export interface ProtocolMessagesState {
  idToResponseMap: ProtocolResponseMap;
  idToRequestMap: ProtocolRequestMap;
  idToErrorMap: ProtocolErrorMap;
}

const protocolMessagesSlice = createSlice({
  initialState: {
    idToResponseMap: {},
    idToRequestMap: {},
    idToErrorMap: {},
  } as ProtocolMessagesState,
  name: "protocolMessages",
  reducers: {
    protocolMessagesReceived(state, action: PayloadAction<ReceivedProtocolMessage[]>) {
      for (const message of action.payload) {
        switch (message.type) {
          case "request": {
            const { value: request } = message;
            const [requestClass, requestMethod] = request.method.split(".");

            const clonedRequest = {
              ...cloneDeep(request),
              class: requestClass,
              method: requestMethod,
              pending: !state.idToResponseMap[request.id],
              errored: !!state.idToErrorMap[request.id],
            };

            state.idToRequestMap[clonedRequest.id] = clonedRequest;
            break;
          }
          case "response": {
            const { value: response } = message;
            state.idToResponseMap[response.id] = cloneDeep(response);

            const request = state.idToRequestMap[response.id];
            if (request) {
              request.pending = false;
            }
            break;
          }
          case "error": {
            const { value: error } = message;
            state.idToErrorMap[error.id] = cloneDeep(error);
            const request = state.idToRequestMap[error.id];
            if (request) {
              request.pending = false;
              request.errored = true;
            }
            break;
          }
        }
      }
    },
  },
});

export const { protocolMessagesReceived } = protocolMessagesSlice.actions;

export default protocolMessagesSlice.reducer;

export const getProtocolErrorMap = (state: UIState) => state.protocolMessages.idToErrorMap;
export const getProtocolRequestMap = (state: UIState) => state.protocolMessages.idToRequestMap;
export const getProtocolResponseMap = (state: UIState) => state.protocolMessages.idToResponseMap;
export const getProtocolRequest = (requestId: number | undefined) => (state: UIState) =>
  requestId ? state.protocolMessages.idToRequestMap[requestId] : undefined;
export const getProtocolResponse = (requestId: number | undefined) => (state: UIState) =>
  requestId ? state.protocolMessages.idToResponseMap[requestId] : undefined;
export const getProtocolError = (requestId: number | undefined) => (state: UIState) =>
  requestId ? state.protocolMessages.idToErrorMap[requestId] : undefined;
export const getFullRequestDetails = (requestIds: number[]) => (state: UIState) =>
  requestIds.map(id => {
    return {
      request: getProtocolRequest(id)(state),
      response: getProtocolResponse(id)(state),
      error: getProtocolError(id)(state),
    };
  });
