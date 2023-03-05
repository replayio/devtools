import {
  AnalysisEntry,
  CommandMethods,
  CommandParams,
  CommandResult,
  EventMethods,
  EventParams,
  PauseId,
  PointDescription,
  ProtocolClient,
  SessionId,
  TimeRange,
  analysisPoints,
  analysisResult,
} from "@replayio/protocol";
import { captureException } from "@sentry/react";

import { ProtocolError, commandError } from "shared/utils/error";

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

let customSocketSendMessageForTesting: SendMessageMethod | null = null;
let socket: WebSocket;
let gSocketOpen = false;

type customSocketSendMessageForTestingResponse = {
  flushQueuedMessages: () => void;
  responseDataHandler: (data: string) => void;
};

// Enables test code to mock out the WebSocket used to send protocol messages.
export function injectCustomSocketSendMessageForTesting(
  sendMessage: SendMessageMethod
): customSocketSendMessageForTestingResponse {
  customSocketSendMessageForTesting = sendMessage;

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

const noCallerStackTracesForErrorCodes = new Set<ProtocolError>([
  ProtocolError.CommandFailed,
  ProtocolError.GraphicsUnavailableAtPoint,
  ProtocolError.InternalError,
  ProtocolError.InvalidRecording,
  ProtocolError.SessionCreationFailure,
  ProtocolError.SessionDestroyed,
  ProtocolError.ServiceUnavailable,
  ProtocolError.TimedOut,
  ProtocolError.TooManyPoints,
  ProtocolError.UnknownBuild,
  ProtocolError.UnknownSession,
  ProtocolError.UnsupportedRecording,
]);
const noCallerStackTracesForFailedCommands = new Set<CommandMethods>([
  "CSS.getAppliedRules",
  "CSS.getComputedStyle",
  "DOM.getAllBoundingClientRects",
  "DOM.getBoundingClientRect",
  "DOM.getBoxModel",
  "DOM.getDocument",
  "DOM.getEventListeners",
  "DOM.getParentNodes",
  "DOM.performSearch",
  "DOM.querySelector",
  "DOM.repaintGraphics",
  "Session.createPause",
]);

export type ExperimentalSettings = {
  listenForMetrics: boolean;
  controllerKey?: string;
  disableCache?: boolean;
  disableScanDataCache?: boolean;
  disableQueryCache?: boolean;
  disableStableQueryCache?: boolean;
  disableUnstableQueryCache?: boolean;
  enableRoutines?: boolean;
  rerunRoutines?: boolean;
  profileWorkerThreads?: boolean;
  disableRecordingAssetsInDatabase?: boolean;
};

type SessionCallbacks = {
  onEvent: (message: any) => void;
  onRequest: (command: Request<CommandMethods>) => void;
  onResponse: (command: CommandResponse) => void;
  onResponseError: (command: CommandResponse) => void;
  onSocketError: (error: Event, initial: boolean) => void;
  onSocketClose: (willClose: boolean) => void;
};

type AnalysisCallbacks = {
  onCreate: (command: CommandResult<"Analysis.createAnalysis">) => void;
  onEvent: (points: PointDescription[]) => void;
  onResults: (results: AnalysisEntry[]) => void;
};

let gSessionCallbacks: SessionCallbacks | undefined;
export let gAnalysisCallbacks: Map<string, AnalysisCallbacks> = new Map();

export function setSessionCallbacks(sessionCallbacks: SessionCallbacks) {
  if (gSessionCallbacks !== undefined) {
    console.error("Session callbacks can only be set once");
    return;
  }

  gSessionCallbacks = sessionCallbacks;
}

export async function createSession(
  recordingId: string,
  loadPoint: string | undefined,
  experimentalSettings: ExperimentalSettings,
  focusWindow: TimeRange | undefined,
  sessionCallbacks: SessionCallbacks
) {
  const { sessionId } = await sendMessage("Recording.createSession", {
    recordingId,
    loadPoint: loadPoint || undefined,
    experimentalSettings,
    focusWindow,
  });

  setSessionCallbacks(sessionCallbacks);

  return sessionId;
}

export function initSocket(address: string): WebSocket | null {
  if (customSocketSendMessageForTesting !== null) {
    // Test environment; a custom WebSocket is being used.
    return null;
  }

  const onopen = makeInfallible(flushQueuedMessages);

  const onclose = makeInfallible(() => {
    gSocketOpen = false;
    gSessionCallbacks?.onSocketClose(willClose);
  });

  const onerror = makeInfallible((evt: Event) => gSessionCallbacks?.onSocketError(evt, false));

  const onInitialError = makeInfallible((evt: Event) =>
    gSessionCallbacks?.onSocketError(evt, true)
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

  socket.onopen = handleOpen;
  socket.onerror = handleOpenError;

  return socket;
}

export async function sendMessage<M extends CommandMethods>(
  method: M,
  params: CommandParams<M>,
  sessionId?: SessionId,
  pauseId?: PauseId
): Promise<CommandResult<M>> {
  const id = gNextMessageId++;
  const msg: CommandRequest = { id, method, params, pauseId, sessionId };
  const callerStackTrace = new Error(`Caller stacktrace for ${method}`);

  if (gSocketOpen) {
    doSend(msg);
  } else {
    gPendingMessages.push(msg);
  }

  const response = await new Promise<CommandResponse>(resolve =>
    gMessageWaiters.set(id, { method, resolve })
  );
  if (response.error) {
    gSessionCallbacks?.onResponseError(response);

    const { code, data, message } = response.error;

    if (method === "Session.listenForLoadChanges" && code === 66) {
      // We are being disconnected after a timeout, no need to raise
      return {};
    }

    console.warn("Message failed", method, { code, id, message }, data);

    let finalMessage = message;
    if (process.env.NODE_ENV === "development") {
      // Include details on the method and params in the error string so that we get more than
      // _just_ "Internal Error" or similar
      finalMessage = `${message} (request: ${method}, ${JSON.stringify(params)})`;
    }
    if (
      !noCallerStackTracesForErrorCodes.has(code) &&
      !(code === ProtocolError.CommandFailed && noCallerStackTracesForFailedCommands.has(method))
    ) {
      captureException(callerStackTrace, { extra: { code, message, method, params } });
    }
    throw commandError(finalMessage, code);
  }

  return response.result as any;
}

const doSend = makeInfallible(message => {
  window.performance?.mark(`${message.method}_start`);
  const stringified = JSON.stringify(message);
  gSentBytes += stringified.length;

  gSessionCallbacks?.onRequest(message);

  if (customSocketSendMessageForTesting !== null) {
    customSocketSendMessageForTesting(stringified);
  } else {
    socket.send(stringified);
  }
});

function flushQueuedMessages() {
  gPendingMessages.forEach(msg => doSend(msg));
  gPendingMessages.length = 0;
  gSocketOpen = true;
}

// TODO Once removeEventListener has a different signature, we can combine these maps.
const gEventListeners = new Map<string, (event: any) => void>();
let gEventToCallbacksMap: Map<string, Function[]> = new Map();

export function addEventListener<M extends EventMethods>(
  event: M,
  handler: (params: EventParams<M>) => void
) {
  if (event === "Analysis.analysisPoints") {
    gEventListeners.set(event, ({ analysisId, points }: analysisPoints) => {
      const callbacks = gAnalysisCallbacks.get(analysisId);
      if (callbacks) {
        callbacks.onEvent(points);
      } else {
        handler({ analysisId, points });
      }
    });
  } else if (event === "Analysis.analysisResult") {
    gEventListeners.set(event, ({ analysisId, results }: analysisResult) => {
      const callbacks = gAnalysisCallbacks.get(analysisId);
      if (callbacks) {
        callbacks.onResults(results);
      } else {
        handler({ analysisId, results });
      }
    });
  } else {
    if (!gEventToCallbacksMap.has(event)) {
      gEventToCallbacksMap.set(event, []);
    }

    gEventToCallbacksMap.get(event)!.push(handler);

    if (!gEventListeners.has(event)) {
      gEventListeners.set(event, data => {
        const callbacks = gEventToCallbacksMap.get(event)!;
        callbacks.forEach(callback => {
          callback(data);
        });
      });
    }
  }
}

export function removeEventListener<M extends EventMethods>(
  event: M,
  handler?: (params: EventParams<M>) => void
) {
  switch (event) {
    case "Analysis.analysisPoints":
    case "Analysis.analysisResult": {
      gEventListeners.delete(event);
      break;
    }
    default: {
      if (handler != null) {
        const handlers = gEventToCallbacksMap.get(event);
        if (handlers != null) {
          const index = handlers.indexOf(handler);
          if (index >= 0) {
            handlers.splice(index, 1);
          }
        }

        if (handlers == null || handlers.length === 0) {
          gEventListeners.delete(event);
        }
      } else {
        gEventListeners.delete(event);

        if (gEventToCallbacksMap.has(event)) {
          gEventToCallbacksMap.delete(event);
        }
      }
      break;
    }
  }
}

export const client = new ProtocolClient({
  addEventListener,
  removeEventListener,
  sendCommand: sendMessage,
});

function socketDataHandler(data: string) {
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

// Debugging methods.
if (typeof window === "object") {
  (window as any).disconnect = () => {
    socket.close();
  };

  (window as any).outstanding = () => {
    const messages = Array.from(gMessageWaiters.entries()).map(([id, { method }]) => ({
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
