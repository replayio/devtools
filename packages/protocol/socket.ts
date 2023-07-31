"use client";

import {
  CommandMethods,
  CommandParams,
  CommandResult,
  EventMethods,
  EventParams,
  PointRangeFocusRequest as FocusWindow,
  PauseId,
  ProtocolClient,
  SessionId,
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

type customSocketSendMessageForTestingResponse = {
  flushQueuedMessages: () => void;
  responseDataHandler: (data: string) => void;
};

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
  keepAllTraces?: boolean;
  disableIncrementalSnapshots?: boolean;
  disableConcurrentControllerLoading?: boolean;
  disableProtocolQueryCache?: boolean;
};

type SessionCallbacks = {
  onEvent: (message: any) => void;
  onRequest: (command: Request<CommandMethods>) => void;
  onResponse: (command: CommandResponse) => void;
  onResponseError: (command: CommandResponse) => void;
  onSocketError: (error: Event, initial: boolean) => void;
  onSocketClose: (willClose: boolean) => void;
};

const noCallerStackTracesForErrorCodes = new Set<ProtocolError>([
  ProtocolError.CommandFailed,
  ProtocolError.DocumentIsUnavailable,
  ProtocolError.FocusWindowChange,
  ProtocolError.GraphicsUnavailableAtPoint,
  ProtocolError.InternalError,
  ProtocolError.InvalidRecording,
  ProtocolError.SessionCreationFailure,
  ProtocolError.SessionDestroyed,
  ProtocolError.ServiceUnavailable,
  ProtocolError.TimedOut,
  ProtocolError.TooManyGeneratedLocations,
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

export class ProtocolSession {
  customSocketSendMessageForTesting: SendMessageMethod | null = null;
  socket: WebSocket | undefined;

  socketOpen = false;
  willClose = false;

  nextMessageId = 1;
  pendingMessages: Request<CommandMethods>[] = [];

  client: ProtocolClient;
  eventToCallbacksMap: Map<string, Function[]> = new Map();

  // TODO Once removeEventListener has a different signature, we can combine these maps.
  eventListeners = new Map<string, (event: any) => void>();

  messageWaiters = new Map<number, MessageWaiter>();
  sessionCallbacks: SessionCallbacks | undefined;

  // These are helpful when investigating connection speeds.
  startTime = Date.now();
  sentBytes = 0;
  receivedBytes = 0;

  constructor() {
    this.client = new ProtocolClient({
      addEventListener: this.addEventListener,
      removeEventListener: this.removeEventListener,
      sendCommand: this.sendMessage,
    });

    // If the socket has errored, the connection will close. So let's set `willClose`
    // so that we show _this_ error message, and not the `onSocketClose` error message
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.willClose = true;
      });
    }

    (window as any).disconnect = () => {
      this.socket?.close();
    };

    (window as any).protocolClient = this.client;

    (window as any).outstanding = () => {
      const messages = Array.from(this.messageWaiters.entries()).map(([id, { method }]) => ({
        id,
        method,
      }));
      return {
        messages,
        received: this.receivedBytes,
        sent: this.sentBytes,
        time: Date.now() - this.startTime,
      };
    };
  }

  flushQueuedMessages() {
    this.pendingMessages.forEach(msg => this.doSend(msg));
    this.pendingMessages.length = 0;
    this.socketOpen = true;
  }

  // Enables test code to mock out the WebSocket used to send protocol messages.
  injectCustomSocketSendMessageForTesting(
    sendMessage: SendMessageMethod
  ): customSocketSendMessageForTestingResponse {
    this.customSocketSendMessageForTesting = sendMessage;

    return {
      flushQueuedMessages: this.flushQueuedMessages,
      responseDataHandler: this.socketDataHandler,
    };
  }
  doSend(message: any) {
    window.performance?.mark(`${message.method}_start`);
    const stringified = JSON.stringify(message);
    this.sentBytes += stringified.length;

    this.sessionCallbacks?.onRequest(message);

    if (this.customSocketSendMessageForTesting !== null) {
      this.customSocketSendMessageForTesting(stringified);
    } else {
      this.socket?.send(stringified);
    }
  }

  addEventListener<M extends EventMethods>(event: M, handler: (params: EventParams<M>) => void) {
    if (!this.eventToCallbacksMap.has(event)) {
      this.eventToCallbacksMap.set(event, []);
    }

    this.eventToCallbacksMap.get(event)!.push(handler);

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, data => {
        const callbacks = this.eventToCallbacksMap.get(event)!;
        callbacks.forEach(callback => {
          callback(data);
        });
      });
    }
  }

  // Used in the `app` helper for local testing
  triggerEvent(method: string, params: any) {
    const handler = this.eventListeners.get(method)!;
    handler(params);
  }
  removeEventListener<M extends EventMethods>(
    event: M,
    handler?: (params: EventParams<M>) => void
  ) {
    if (handler != null) {
      const handlers = this.eventToCallbacksMap.get(event);
      if (handlers != null) {
        const index = handlers.indexOf(handler);
        if (index >= 0) {
          handlers.splice(index, 1);
        }
      }

      if (handlers == null || handlers.length === 0) {
        this.eventListeners.delete(event);
      }
    } else {
      this.eventListeners.delete(event);

      if (this.eventToCallbacksMap.has(event)) {
        this.eventToCallbacksMap.delete(event);
      }
    }
  }

  setSessionCallbacks(sessionCallbacks: SessionCallbacks) {
    if (this.sessionCallbacks !== undefined) {
      console.error("Session callbacks can only be set once");
      return;
    }

    this.sessionCallbacks = sessionCallbacks;
  }

  async createSession(
    recordingId: string,
    loadPoint: string | undefined,
    experimentalSettings: ExperimentalSettings,
    focusWindow: FocusWindow | undefined,
    sessionCallbacks: SessionCallbacks
  ) {
    const { sessionId } = await this.sendMessage("Recording.createSession", {
      recordingId,
      loadPoint: loadPoint || undefined,
      experimentalSettings,
      focusRequest: focusWindow,
    });

    this.setSessionCallbacks(sessionCallbacks);

    return sessionId;
  }

  initSocket(address: string): WebSocket | null {
    if (this.customSocketSendMessageForTesting !== null) {
      // Test environment; a custom WebSocket is being used.
      return null;
    }

    const onopen = makeInfallible(this.flushQueuedMessages);

    const onclose = makeInfallible(() => {
      this.socketOpen = false;
      this.sessionCallbacks?.onSocketClose(this.willClose);
    });

    const onerror = makeInfallible((evt: Event) =>
      this.sessionCallbacks?.onSocketError(evt, false)
    );

    const onInitialError = makeInfallible((evt: Event) =>
      this.sessionCallbacks?.onSocketError(evt, true)
    );

    const onmessage = makeInfallible(this.socketDataHandler);

    const handleOpen = () => {
      if (!this.socket) {
        return;
      }
      this.socket.onerror = onerror;
      this.socket.onclose = onclose;
      this.socket.onmessage = event => onmessage(event.data);
      onopen();
    };

    const handleOpenError = () => {
      // If the first attempt fails, try one more time.
      this.socket = new WebSocket(address);
      this.socket.onopen = handleOpen;
      this.socket.onerror = onInitialError;
    };

    // First attempt at opening socket.
    this.socket = new WebSocket(address);

    this.socket.onopen = handleOpen;
    this.socket.onerror = handleOpenError;

    return this.socket;
  }

  async sendMessage<M extends CommandMethods>(
    method: M,
    params: CommandParams<M>,
    sessionId?: SessionId,
    pauseId?: PauseId,
    noCallerStackTrace = false
  ): Promise<CommandResult<M>> {
    const id = this.nextMessageId++;
    const msg: CommandRequest = { id, method, params, pauseId, sessionId };
    const callerStackTrace = new Error(`Caller stacktrace for ${method}`);

    if (this.socketOpen) {
      this.doSend(msg);
    } else {
      this.pendingMessages.push(msg);
    }

    const response = await new Promise<CommandResponse>(resolve =>
      this.messageWaiters.set(id, { method, resolve })
    );

    if (response.error) {
      this.sessionCallbacks?.onResponseError(response);

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
        !noCallerStackTrace &&
        !noCallerStackTracesForErrorCodes.has(code) &&
        !(
          code === ProtocolError.CommandFailed && noCallerStackTracesForFailedCommands.has(method)
        ) &&
        !(code === ProtocolError.TooManyLocations && method === "Debugger.getHitCounts")
      ) {
        captureException(callerStackTrace, { extra: { code, message, method, params } });
      }

      throw commandError(finalMessage, code, { id, method, params, pauseId, sessionId });
    }

    return response.result as any;
  }

  socketDataHandler(data: string) {
    this.receivedBytes += data.length;
    const msg = JSON.parse(data);

    if (msg.id) {
      const { method, resolve } = this.messageWaiters.get(msg.id)!;
      this.sessionCallbacks?.onResponse(msg);

      window.performance?.mark(`${method}_end`);
      window.performance?.measure(method, `${method}_start`, `${method}_end`);

      this.messageWaiters.delete(msg.id);
      resolve(msg);
    } else if (this.eventListeners.has(msg.method)) {
      this.sessionCallbacks?.onEvent(msg);

      const handler = this.eventListeners.get(msg.method)!;
      handler(msg.params);
    } else {
      console.error("Received unknown message", msg);
    }
  }
}

export const protocolSession = new ProtocolSession();
export const client = protocolSession.client;
export const addEventListener = protocolSession.addEventListener.bind(protocolSession);
export const removeEventListener = protocolSession.removeEventListener.bind(protocolSession);
export const initSocket = protocolSession.initSocket.bind(protocolSession);
export const createSession = protocolSession.createSession.bind(protocolSession);
export const setSessionCallbacks = protocolSession.setSessionCallbacks.bind(protocolSession);
export const sendMessage = protocolSession.sendMessage.bind(protocolSession);
export const triggerEvent = protocolSession.triggerEvent.bind(protocolSession);
export const injectCustomSocketSendMessageForTesting =
  protocolSession.injectCustomSocketSendMessageForTesting.bind(protocolSession);
