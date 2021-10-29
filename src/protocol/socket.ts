import { defer, makeInfallible } from "./utils";
import {
  ProtocolClient,
  EventMethods,
  EventParams,
  CommandMethods,
  SessionId,
  PauseId,
  CommandParams,
  CommandResult,
} from "@recordreplay/protocol";
import { setUnexpectedError } from "ui/actions/session";
import { UIStore } from "ui/actions";
import { Action, Dispatch } from "redux";
import { isMock, mockEnvironment, waitForMockEnvironment } from "ui/utils/environment";
import { UnexpectedError } from "ui/state/app";

interface Message {
  id: number;
  method: string;
  params: any;
  sessionId?: string;
  pauseId?: string;
}

let socket: WebSocket;
let gSocketOpen = false;

let gPendingMessages: Message[] = [];
let gNextMessageId = 1;

interface MessageWaiter {
  method: string;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

const gMessageWaiters = new Map<number, MessageWaiter>();

// These are helpful when investigating connection speeds.
const gStartTime = Date.now();
let gSentBytes = 0;
let gReceivedBytes = 0;
let lastReceivedMessageTime = Date.now();

let willClose = false;
window.addEventListener("beforeunload", () => {
  willClose = true;
});

export function initSocket(store: UIStore, address: string) {
  if (isMock()) {
    waitForMockEnvironment().then(env => {
      env!.setOnSocketMessage(onSocketMessage as any);
      onSocketOpen();
    });
    return;
  }

  socket = new WebSocket(address);

  socket.onopen = makeInfallible(onSocketOpen);
  socket.onclose = makeInfallible(() => store.dispatch(onSocketClose()));
  socket.onerror = makeInfallible((evt: Event) => store.dispatch(onSocketError(evt)));
  socket.onmessage = makeInfallible(onSocketMessage);
}

export function sendMessage<M extends CommandMethods>(
  method: M,
  params: CommandParams<M>,
  sessionId?: SessionId,
  pauseId?: PauseId
): Promise<CommandResult<M>> {
  const id = gNextMessageId++;
  const msg = { id, sessionId, pauseId, method, params };

  if (gSocketOpen) {
    doSend(msg);
  } else {
    gPendingMessages.push(msg);
  }

  const { promise, resolve, reject } = defer<any>();
  gMessageWaiters.set(id, { method, resolve, reject });

  return promise;
}

const doSend = makeInfallible(msg => {
  window.performance?.mark(`${msg.method}_start`);
  const str = JSON.stringify(msg);
  gSentBytes += str.length;

  if (isMock()) {
    mockEnvironment().sendSocketMessage(str);
  } else {
    socket.send(str);
  }
});

function onSocketOpen() {
  console.log("Socket Open");
  gPendingMessages.forEach(msg => doSend(msg));
  gPendingMessages.length = 0;
  gSocketOpen = true;
}

const gEventListeners = new Map<string, (ev: any) => void>();

export function addEventListener<M extends EventMethods>(
  event: M,
  handler: (params: EventParams<M>) => void
) {
  if (gEventListeners.has(event)) {
    throw new Error("Duplicate event listener: " + event);
  }
  gEventListeners.set(event, handler);
}

export function removeEventListener<M extends EventMethods>(event: M) {
  gEventListeners.delete(event);
}

export const client = new ProtocolClient({
  sendCommand: sendMessage,
  addEventListener,
  removeEventListener,
});

function onSocketMessage(evt: MessageEvent<any>) {
  lastReceivedMessageTime = Date.now();
  gReceivedBytes += evt.data.length;
  const msg = JSON.parse(evt.data);

  if (msg.id) {
    const { method, resolve, reject } = gMessageWaiters.get(msg.id)!;
    window.performance?.mark(`${method}_end`);
    window.performance?.measure(method, `${method}_start`, `${method}_end`);

    gMessageWaiters.delete(msg.id);
    if (msg.error) {
      console.warn("Message failed", method, msg.error, msg.data);
      reject(msg.error);
    } else {
      resolve(msg.result);
    }
  } else if (gEventListeners.has(msg.method)) {
    const handler = gEventListeners.get(msg.method)!;
    handler(msg.params);
  } else {
    console.error("Received unknown message", msg);
  }
}

const disconnectedError: UnexpectedError = {
  message: "Are you still there?",
  content: "Replays disconnect after 5 minutes to reduce server load. Ready when you are!",
  action: "refresh",
};

function onSocketClose() {
  return ({ dispatch }: { dispatch: Dispatch<Action> }) => {
    log("Socket Closed");
    gSocketOpen = false;

    if (!willClose) {
      dispatch(setUnexpectedError(disconnectedError, true));
    }
  };
}

function onSocketError(evt: Event) {
  console.error("Socket Error", evt);
  // If the socket has errored, the connection will close. So let's set `willClose`
  // so that we show _this_ error message, and not the `onSocketClose` error message
  willClose = true;
  return ({ dispatch }: { dispatch: Dispatch<Action> }) => {
    log("Socket Error");
    if (Date.now() - lastReceivedMessageTime < 300000) {
      dispatch(
        setUnexpectedError({
          message: "Unexpected socket error",
          content: "The socket has closed due to an error. Please refresh the page.",
          action: "refresh",
          ...evt,
        })
      );
    } else {
      dispatch(setUnexpectedError(disconnectedError, true));
    }
  };
}

export function log(text: string) {
  // Don't actually log anything. This is a convenient place to add a logpoint
  // when reviewing recordings of the viewer.
}

// Debugging methods.
if (typeof window === "object") {
  (window as any).disconnect = () => {
    socket.close();
  };

  (window as any).outstanding = () => {
    const messages = [...gMessageWaiters.entries()].map(([id, { method }]) => ({
      id,
      method,
    }));
    return {
      messages,
      time: Date.now() - gStartTime,
      sent: gSentBytes,
      received: gReceivedBytes,
    };
  };
}
