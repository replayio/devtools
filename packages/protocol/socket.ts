import {
  ProtocolClient,
  EventMethods,
  EventParams,
  CommandMethods,
  SessionId,
  PauseId,
  CommandParams,
  CommandResult,
} from "@replayio/protocol";

import { makeInfallible } from "./utils";

export interface Request<T extends CommandMethods> {
  id: number;
  method: T;
  params: CommandParams<T>;
  sessionId?: string;
  pauseId?: string;
}

export type CommandRequest = Request<CommandMethods>;

type SendMessageMethod = (message: string) => void;

let customSendMessageHandler: SendMessageMethod | null = null;
let socket: WebSocket;
let gSocketOpen = false;

type setCustomSendMessageHandlerResponse = {
  flushQueuedMessages: () => void;
  responseDataHandler: (data: string) => void;
};

// Enables test code to mock out the WebSocket used to send protocol messages.
export function setCustomSendMessageHandler(
  sendMessage: SendMessageMethod
): setCustomSendMessageHandlerResponse {
  customSendMessageHandler = sendMessage;

  return {
    flushQueuedMessages,
    responseDataHandler: socketDataHandler,
  };
}

let gPendingMessages: Request<CommandMethods>[] = [];
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
  method: CommandMethods;
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
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    willClose = true;
  });
}

export type ExperimentalSettings = {
  listenForMetrics: boolean;
  disableCache?: boolean;
  useMultipleControllers: boolean;
  multipleControllerUseSnapshots: boolean;
};

type SessionCallbacks = {
  onEvent: (message: any) => void;
  onRequest: (command: Request<CommandMethods>) => void;
  onResponse: (command: CommandResponse) => void;
  onResponseError: (command: CommandResponse) => void;
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
  if (customSendMessageHandler !== null) {
    // Test environment; a custom WebSocket is being used.
    return;
  }

  const onopen = makeInfallible(flushQueuedMessages);

  const onclose = makeInfallible(() => {
    gSocketOpen = false;
    gSessionCallbacks?.onSocketClose(willClose);
  });

  const onerror = makeInfallible((evt: Event) =>
    gSessionCallbacks?.onSocketError(evt, false, lastReceivedMessageTime)
  );

  const onInitialError = makeInfallible((evt: Event) =>
    gSessionCallbacks?.onSocketError(evt, true, lastReceivedMessageTime)
  );

  const onmessage = makeInfallible(socketDataHandler);

  const handleOpen = () => {
    socket.onerror = onerror;
    socket.onclose = onclose;
    socket.onmessage = event => onmessage(event.data);
    onopen();
  };
  const handleOpenError = () => {
    // If the first attempt fails, try one more time.
    socket = new WebSocket(address);
    socket.onopen = handleOpen;
    socket.onerror = onInitialError;
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
  const msg: CommandRequest = { id, method, params, pauseId, sessionId };

  if (gSocketOpen) {
    doSend(msg);
  } else {
    gPendingMessages.push(msg);
  }

  return new Promise<CommandResponse>(resolve => gMessageWaiters.set(id, { method, resolve })).then(
    response => {
      if (response.error) {
        gSessionCallbacks?.onResponseError(response);

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

const doSend = makeInfallible(message => {
  window.performance?.mark(`${message.method}_start`);
  const stringified = JSON.stringify(message);
  gSentBytes += stringified.length;

  gSessionCallbacks?.onRequest(message);

  if (customSendMessageHandler !== null) {
    customSendMessageHandler(stringified);
  } else {
    socket.send(stringified);
  }
});

function flushQueuedMessages() {
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

function socketDataHandler(data: string) {
  lastReceivedMessageTime = Date.now();
  gReceivedBytes += data.length;
  const msg = JSON.parse(data);

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
