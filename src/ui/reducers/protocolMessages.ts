import { EventMethods, EventParams } from "@recordreplay/protocol";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import cloneDeep from "lodash/cloneDeep";
import { CommandRequest, CommandResponse } from "protocol/socket";
import { UIState } from "ui/state";

interface Recorded {
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
  requests: RequestSummary[];
  responses: (CommandResponse & Recorded)[];
  errors: (CommandResponse & Recorded)[];
}

const protocolMessagesSlice = createSlice({
  initialState: {
    events: [],
    requests: [],
    responses: [],
    errors: [],
  } as ProtocolMessagesState,
  name: "protocolMessages",
  reducers: {
    eventReceived(state, action: PayloadAction<ProtocolEvent & Recorded>) {
      state.events.push(cloneDeep(action.payload));
    },
    responseReceived(state, action: PayloadAction<CommandResponse & Recorded>) {
      state.responses.push(cloneDeep(action.payload));
      const request = state.requests.find(r => r.id === action.payload.id);
      if (request) {
        request.pending = false;
      }
    },
    errorReceived(state, action: PayloadAction<CommandResponse & Recorded>) {
      state.errors.push(action.payload);
      const request = state.requests.find(r => r.id === action.payload.id);
      if (request) {
        request.pending = false;
        request.errored = true;
      }
    },
    requestSent(state, action: PayloadAction<CommandRequest & Recorded>) {
      const [requestClass, requestMethod] = action.payload.method.split(".");
      state.requests.push({
        ...action.payload,
        class: requestClass,
        method: requestMethod,
        pending: !state.responses.some(r => r.id === action.payload.id),
        errored: state.errors.some(r => r.id === action.payload.id),
      });
    },
  },
});

export const { errorReceived, eventReceived, requestSent, responseReceived } =
  protocolMessagesSlice.actions;

export default protocolMessagesSlice.reducer;

export const getProtocolEvents = (state: UIState) => state.protocolMessages.events;
export const getProtocolRequests = (state: UIState) => state.protocolMessages.requests;
export const getProtocolResponses = (state: UIState) => state.protocolMessages.responses;
