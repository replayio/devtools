import { EventMethods, EventParams } from "@recordreplay/protocol";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
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

export interface ProtocolMessagesState {
  events: (ProtocolEvent & Recorded)[];
  idToResponseMap: {[key: number]: CommandResponse & Recorded};
  idToRequestMap: {[key: number]: RequestSummary};
  errors: (CommandResponse & Recorded)[];
}

const protocolMessagesSlice = createSlice({
  initialState: {
    events: [],
    idToResponseMap: {},
    idToRequestMap: {},
    errors: [],
  } as ProtocolMessagesState,
  name: "protocolMessages",
  reducers: {
    eventReceived(state, action: PayloadAction<ProtocolEvent & Recorded>) {
      state.events.push(cloneDeep(action.payload));
    },
    responseReceived(state, action: PayloadAction<CommandResponse & Recorded>) {
      const clonedResponse = cloneDeep(action.payload);

      state.idToResponseMap[clonedResponse.id] = clonedResponse;

      const request = state.idToRequestMap[action.payload.id];
      if (request) {
        request.pending = false;
      }
    },
    errorReceived(state, action: PayloadAction<CommandResponse & Recorded>) {
      state.errors.push(action.payload);
      const request = state.idToRequestMap[action.payload.id];
      if (request) {
        request.pending = false;
        request.errored = true;
      }
    },
    requestSent(state, action: PayloadAction<CommandRequest & Recorded>) {
      const [requestClass, requestMethod] = action.payload.method.split(".");

      const clonedRequest = {
        ...action.payload,
        class: requestClass,
        method: requestMethod,
        pending: !state.idToResponseMap[action.payload.id],
        errored: state.errors.some(r => r.id === action.payload.id),
      };

      state.idToRequestMap[clonedRequest.id] = clonedRequest;
    },
  },
});

export const { errorReceived, eventReceived, requestSent, responseReceived } =
  protocolMessagesSlice.actions;

export default protocolMessagesSlice.reducer;

export const getProtocolEvents = (state: UIState) => state.protocolMessages.events;
export const getProtocolRequestsMap = (state: UIState) => state.protocolMessages.idToRequestMap;
export const getProtocolResponseMap = (state: UIState) => state.protocolMessages.idToResponseMap;
export const getProtocolRequest = (requestId: number | undefined) => (state: UIState) =>
  requestId ? state.protocolMessages.idToRequestMap[requestId] : undefined;
export const getProtocolResponse = (requestId: number | undefined) => (state: UIState) =>
  requestId ? state.protocolMessages.idToResponseMap[requestId] : undefined;
export const getProtocolError = (requestId: number | undefined) => (state: UIState) =>
  requestId ? state.protocolMessages.errors.find(r => r.id === requestId) : undefined;
export const getFullRequestDetails = (requestIds: number[]) => (state: UIState) =>
  requestIds.map(id => {
    return {
      request: getProtocolRequest(id)(state),
      response: getProtocolResponse(id)(state),
      error: getProtocolError(id)(state),
    };
  });
