import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { EventMethods, EventParams } from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";

import { CommandRequest, CommandResponse } from "protocol/socket";
import { UIState } from "ui/state";
import { features } from "ui/utils/prefs";

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

export type ProtocolResponseMap = { [id: number]: CommandResponse & Recorded };
export type ProtocolRequestMap = { [id: number]: RequestSummary };
export type ProtocolErrorMap = { [id: number]: CommandResponse & Recorded };

export interface ProtocolMessagesState {
  events: (ProtocolEvent & Recorded)[];
  idToResponseMap: ProtocolResponseMap;
  idToRequestMap: ProtocolRequestMap;
  idToErrorMap: ProtocolErrorMap;
}

const protocolMessagesSlice = createSlice({
  initialState: {
    events: [],
    idToResponseMap: {},
    idToRequestMap: {},
    idToErrorMap: {},
  } as ProtocolMessagesState,
  name: "protocolMessages",
  reducers: {
    eventReceived(state, action: PayloadAction<ProtocolEvent & Recorded>) {
      state.events.push(cloneDeep(action.payload));
    },
    responseReceived(state, action: PayloadAction<CommandResponse & Recorded>) {
      // Pre-freeze a copy of the top object, so that Immer doesn't recurse.
      // This avoids errors with `ValueFront` and other object types being frozen,
      // and then mutated by other app code later, but also avoids a costly
      // deep clone of the entire message structure here.
      const frozenMessage = Object.freeze({ ...action.payload });
      state.idToResponseMap[frozenMessage.id] = frozenMessage;

      const request = state.idToRequestMap[frozenMessage.id];
      if (request) {
        request.pending = false;
      }
    },
    errorReceived(state, action: PayloadAction<CommandResponse & Recorded>) {
      state.idToErrorMap[action.payload.id] = action.payload;
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
        errored: !!state.idToErrorMap[action.payload.id],
      };

      state.idToRequestMap[clonedRequest.id] = clonedRequest;
    },
  },
});

export const { errorReceived, eventReceived, requestSent, responseReceived } =
  protocolMessagesSlice.actions;

export default protocolMessagesSlice.reducer;

export const getProtocolEvents = (_state: UIState) => {
  if (!features.logProtocolEvents) {
    console.log("protocol events are disabled");
  }

  return [];
};
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
