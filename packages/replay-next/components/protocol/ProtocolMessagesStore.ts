import { CommandMethods } from "@replayio/protocol";

import { CommandResponse } from "protocol/socket";
import { Request } from "protocol/socket";
import { setSessionCallbacks } from "replay-next/../protocol/socket";

export type Event = {
  type: "Event";
} & any;

export type RequestResponse = {
  type: "RequestResponse";
  duration: number | null;
  error: CommandResponse | null;
  request: Request<CommandMethods>;
  response: CommandResponse | null;
};

export type SocketError = {
  type: "SocketError";
  error: Event;
  initial: boolean;
};

export type SocketWillClose = {
  type: "SocketWillClose";
  willClose: boolean;
};

type Listener = () => void;

export type ProtocolMessage = Event | RequestResponse | SocketError | SocketWillClose;

const protocolMessages: ProtocolMessage[] = [];

const inProgressRequests: Map<number, [requestResponse: RequestResponse, startTime: number]> =
  new Map();

let listeners: Set<Listener> = new Set();

export function getProtocolMessages(): ProtocolMessage[] {
  return protocolMessages;
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifySubscribers() {
  listeners.forEach(listener => listener());
}

export function initProtocolMessagesStore() {
  setSessionCallbacks({
    onEvent: (event: any) => {
      protocolMessages.push({
        type: "Event",
        event,
      });
      notifySubscribers();
    },
    onRequest: (request: Request<CommandMethods>) => {
      const requestResponse: RequestResponse = {
        type: "RequestResponse",
        duration: null,
        error: null,
        request,
        response: null,
      };
      inProgressRequests.set(request.id, [requestResponse, performance.now()]);
      protocolMessages.push(requestResponse);
      notifySubscribers();
    },
    onResponse: (response: CommandResponse) => {
      const match = inProgressRequests.get(response.id);
      if (match) {
        inProgressRequests.delete(response.id);

        const [requestResponse, startTime] = match;
        requestResponse.duration = performance.now() - startTime;
        requestResponse.response = response;
        notifySubscribers();
      }
    },
    onResponseError: (error: CommandResponse) => {
      const match = inProgressRequests.get(error.id);
      if (match) {
        inProgressRequests.delete(error.id);

        const [requestResponse, startTime] = match;
        requestResponse.duration = performance.now() - startTime;
        requestResponse.error = error;
        notifySubscribers();
      }
    },
    onSocketError: (error: Event, initial: boolean) => {
      protocolMessages.push({
        type: "SocketError",
        error,
        initial,
      });
      notifySubscribers();
    },
    onSocketClose: (willClose: boolean) => {
      protocolMessages.push({
        type: "SocketWillClose",
        willClose,
      });
      notifySubscribers();
    },
  });
}
