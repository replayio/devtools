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
import { isMock, mockEnvironment, waitForMockEnvironment } from "ui/utils/environment";

import { requiresWindow } from "../ssr";

import { makeInfallible } from "./utils";

export interface Message {
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

export type CommandResponse =
  | {
      id: number;
      result: unknown;
      error?: undefined;
    }
  | {
      id: number;
      result?: undefined;
      error: {
        code: number;
        message: string;
        data?: unknown;
      };
    };

interface MessageWaiter {
  method: string;
  resolve: (value: CommandResponse) => void;
}

const gMessageWaiters = new Map<number, MessageWaiter>();

// These are helpful when investigating connection speeds.
const gStartTime = Date.now();
let gSentBytes = 0;
let gReceivedBytes = 0;

// If the socket has errored, the connection will close. So let's set `willClose`
// so that we show _this_ error message, and not the `onSocketClose` error message
let willClose = false;
requiresWindow(win => {
  win.addEventListener("beforeunload", () => {
    willClose = true;
  });
});

export type ExperimentalSettings = {
  listenForMetrics: boolean;
  disableCache?: boolean;
  useMultipleControllers: boolean;
  multipleControllerUseSnapshots: boolean;
};

type SessionCallbacks = {
  onEvent: (message: MessageEvent) => void;
  onRequest: (command: Message) => void;
  onResponse: (command: CommandResponse) => void;
  onResponseError: (command: Message) => void;
  onSocketError: (error: Event, initial: boolean, lastReceivedMessageTime: Number) => void;
  onSocketClose: (willClose: boolean) => void;
};

let gSessionCallbacks: SessionCallbacks | undefined;
let lastReceivedMessageTime = Date.now();

export async function createSession(
  recordingId: string,
  loadPoint: string | undefined,
  experimentalSettings: ExperimentalSettings,
  sessionCallbacks: SessionCallbacks
) {
  const { sessionId } = await sendMessage("Recording.createSession", {
    recordingId,
    loadPoint: loadPoint || undefined,
    experimentalSettings,
  });

  gSessionCallbacks = sessionCallbacks;
  return sessionId;
}

export function initSocket(address: string) {
  if (isMock()) {
    waitForMockEnvironment().then(env => {
      env!.setOnSocketMessage(onSocketMessage as any);
      onSocketOpen();
    });
    return;
  }

  const onopen = makeInfallible(onSocketOpen);

  const onclose = makeInfallible(() => {
    gSocketOpen = false;
    gSessionCallbacks?.onSocketClose(willClose);
  });

  const onerror = makeInfallible((evt: Event) =>
    gSessionCallbacks?.onSocketError(evt, false, lastReceivedMessageTime)
  );

  const oninitialerror = makeInfallible((evt: Event) =>
    gSessionCallbacks?.onSocketError(evt, true, lastReceivedMessageTime)
  );

  const onmessage = makeInfallible(onSocketMessage);

  const handleOpen = () => {
    socket.onerror = onerror;
    socket.onclose = onclose;
    socket.onmessage = onmessage;
    onopen();
  };
  const handleOpenError = () => {
    // If the first attempt fails, try one more time.
    socket = new WebSocket(address);
    socket.onopen = handleOpen;
    socket.onerror = oninitialerror;
  };

  // First attempt at opening socket.
  socket = new WebSocket(address);

  // @ts-ignore
  window.app.socket = socket;

  socket.onopen = handleOpen;
  socket.onerror = handleOpenError;
}

export function sendMessage<M extends CommandMethods>(
  method: M,
  params: CommandParams<M>,
  sessionId?: SessionId,
  pauseId?: PauseId
): Promise<CommandResult<M>> {
  const id = gNextMessageId++;
  const msg: Message = { id, method, params, pauseId, sessionId };

  if (gSocketOpen) {
    doSend(msg);
  } else {
    gPendingMessages.push(msg);
  }

  return new Promise<CommandResponse>(resolve => gMessageWaiters.set(id, { method, resolve })).then(
    response => {
      if (response.error) {
        gSessionCallbacks?.onResponseError(msg);

        const { code, data, message } = response.error;
        console.warn("Message failed", method, { code, id, message }, data);

        const err = new Error(message) as any;
        err.name = "CommandError";
        err.code = code;
        throw err;
      }

      return response.result as any;
    }
  );
}

const doSend = makeInfallible(msg => {
  window.performance?.mark(`${msg.method}_start`);
  const str = JSON.stringify(msg);
  gSentBytes += str.length;

  gSessionCallbacks?.onRequest(msg);
  if (isMock()) {
    mockEnvironment().sendSocketMessage(str);
  } else {
    socket.send(str);
  }
});

function onSocketOpen() {
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
  addEventListener,
  removeEventListener,
  sendCommand: sendMessage,
});

function onSocketMessage(evt: MessageEvent<any>) {
  lastReceivedMessageTime = Date.now();
  gReceivedBytes += evt.data.length;
  const msg = JSON.parse(evt.data);

  if (msg.id) {
    const { method, resolve } = gMessageWaiters.get(msg.id)!;
    gSessionCallbacks?.onResponse(msg);

    window.performance?.mark(`${method}_end`);
    window.performance?.measure(method, `${method}_start`, `${method}_end`);

    gMessageWaiters.delete(msg.id);
    resolve(msg);
  } else if (gEventListeners.has(msg.method)) {
    gSessionCallbacks?.onEvent(msg);

    const handler = gEventListeners.get(msg.method)!;
    handler(msg.params);
  } else {
    console.error("Received unknown message", msg);
  }
}

// Used in the `app` helper for local testing
export function triggerEvent(method: string, params: any) {
  const handler = gEventListeners.get(method)!;
  handler(params);
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
      received: gReceivedBytes,
      sent: gSentBytes,
      time: Date.now() - gStartTime,
    };
  };

  (window as any).protocolClient = client;
}
