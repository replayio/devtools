/* Copyright 2022 Record Replay Inc. */

import type http from "http";
import type https from "https";
import type net from "net";
import WSWebSocket from "ws";

import { logError } from "./logger";
import { EventEmitter } from "events";
import { assert } from "./assert";
import { MsPerSecond } from "./utils";

enum CloseCode {
  Normal = 1000,

  // The WebSocket spec reserves to 4000-4999 codes for application-specific
  // purposes, so we can throw anything specific we want in here.
  MissingBinaryMessage = 4000,
  UnexpectedBinaryMessage = 4001,
  InvalidJSONMessage = 4002,
  InvalidObjectMessage = 4003,
  InvalidBinaryPropery = 4004,
}

function getCodeReason(code: CloseCode): string {
  switch (code) {
    case CloseCode.MissingBinaryMessage:
      return "All messages with binary:true must be followed by a binary message.";
    case CloseCode.UnexpectedBinaryMessage:
      return "All binary messages must have a preceding JSON message with binary:true.";
    case CloseCode.InvalidJSONMessage:
      return "All text messages must be valid JSON.";
    case CloseCode.InvalidObjectMessage:
      return "All JSON payloads must be objects.";
    case CloseCode.InvalidBinaryPropery:
      return "All JSON objects with a 'binary' key must have a boolean value.";
  }

  return "";
}

export type MessageObject = {
  binary?: boolean | undefined;
  [key: string]: unknown;
};

// We export the message type so that it can be reference in other files
// easily, but we don't export the class itself because it should only be
// constructed inside this file.
export type { Message };

class Message {
  readonly text: string;
  readonly msg: MessageObject;
  readonly data: Buffer | null;

  constructor(text: string, msg: MessageObject, data: Buffer | null) {
    this.text = text;
    this.msg = msg;
    this.data = data;
  }
}

type ServerPingOptions = {
  pingInterval: number;
  responseTimeout: number;
};

type ServerOptions = {
  server?: http.Server | https.Server;
  maxPayload?: number;
  ping?: ServerPingOptions;
  compression?: boolean;
};

export declare interface WebSocketServer {
  on(event: "error", listener: (err: Error) => void): this;
  on(
    event: "connection",
    listener: (connection: WebSocket, req: http.IncomingMessage) => void
  ): this;
}

export class WebSocketServer extends EventEmitter {
  private server: WSWebSocket.Server;
  private sockets: WeakMap<WSWebSocket, WebSocket> = new WeakMap();
  private pingInterval: NodeJS.Timeout | null = null;
  private pingResponseTimeout: number = 0;

  constructor({ server, maxPayload, ping, compression }: ServerOptions) {
    super();
    this.server = new WSWebSocket.Server({
      server: server || undefined,
      noServer: !server,
      perMessageDeflate: compression
        ? {
            zlibDeflateOptions: {
              chunkSize: 1024,
              memLevel: 7,
              level: 3,
            },
            zlibInflateOptions: { chunkSize: 10 * 1024 },
            clientNoContextTakeover: false,
            serverNoContextTakeover: false,
            serverMaxWindowBits: 12,
            concurrencyLimit: 10,
            threshold: 1024,
          }
        : false,
      maxPayload,
    });
    this.server.on("connection", this.onConnection.bind(this));
    this.server.on("error", this.onError.bind(this));
    this.server.on("close", this.onClose.bind(this));

    if (ping) {
      this.pingResponseTimeout = ping.responseTimeout;
      this.pingInterval = setInterval(this.pingSockets.bind(this), ping.pingInterval).unref();
    }
  }

  // Allow for easy shutdown of all connections if we want to
  // shut down the event loop ASAP. Don't use this otherwise.
  terminateActiveConnections(): void {
    for (const socket of Array.from(this.server.clients)) {
      socket.terminate();
    }
  }

  doUpgrade(request: http.IncomingMessage, socket: net.Socket, upgradeHead: Buffer): void {
    this.server.handleUpgrade(request, socket, upgradeHead, ws => {
      this.server.emit("connection", ws, request);
    });
  }

  activeConnectionCount(): number {
    return this.server.clients.size;
  }

  private pingSockets() {
    const lastMessageLimit = Date.now() - this.pingResponseTimeout;

    for (const connection of this.server.clients) {
      const socket = this.sockets.get(connection);
      assert(socket);

      if (socket.lastMessageTime < lastMessageLimit) {
        logError("TerminatingSocket", {
          delay: lastMessageLimit - socket.lastMessageTime,
        });
        connection.terminate();
        continue;
      }

      if (connection.readyState === WSWebSocket.OPEN) {
        connection.ping();
      }
    }
  }

  private onError(err: Error) {
    this.emit("error", err);
  }

  private onClose() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }

  private onConnection(connection: WSWebSocket, req: http.IncomingMessage) {
    const socket = new WebSocket(connection);
    this.sockets.set(connection, socket);
    this.emit("connection", socket, req);
  }
}

type ClientPingOptions = {
  pingInterval: number;
  responseTimeout: number;
  openTimeout?: number;
};

type ClientHeaders = { [name: string]: string };
type ClientOptions = {
  headers?: ClientHeaders;
  maxPayload?: number;
  ping?: ClientPingOptions;
};

export declare interface WebSocket {
  on(event: "open", listener: () => void): this;
  on(event: "close", listener: (code: number, reason: string) => void): this;
  on(event: "error", listener: (err: Error) => void): this;
  on(event: "message", listener: (message: Message) => void): this;
}

export class WebSocket extends EventEmitter {
  private connection: WSWebSocket;
  private pendingBinaryMessage: { text: string; msg: MessageObject } | null = null;
  private pendingMessages: Array<{
    text: string;
    data: Buffer | null;
    callback?: (e: unknown) => void;
  }> = [];
  lastMessageTime = Date.now();
  private pingInterval: NodeJS.Timeout | null = null;
  private pingResponseTimeout: number = 0;
  private openTimeout: number = 0;

  constructor(connection: WSWebSocket | string, options: ClientOptions = {}) {
    super();

    if (typeof connection === "string") {
      connection = new WSWebSocket(connection, undefined, {
        maxPayload: options.maxPayload,
        headers: options.headers || {},
      });
    } else {
      assert(
        options.maxPayload === undefined,
        "Can't specify maxPayload for an already-connected socket"
      );
      assert(!options.headers, "Can't specify headers for an already-connected socket");
    }
    this.connection = connection;
    this.connection.on("message", this.onMessage.bind(this));
    this.connection.on("open", this.onOpen.bind(this));
    this.connection.on("close", this.onClose.bind(this));
    this.connection.on("error", this.onError.bind(this));
    this.connection.on("pong", this.onPong.bind(this));

    if (options.ping) {
      // If a socket is being pinged, we're expecting it to be important that we
      // detect errors. In this case, we default to assuming the socket should open
      // within a second as a reasonable baseline.
      this.openTimeout = options.ping.openTimeout ?? MsPerSecond;
      this.pingResponseTimeout = options.ping.responseTimeout;
      this.pingInterval = setInterval(
        this.pingSocket.bind(this),
        options.ping.pingInterval
      ).unref();
    }
  }

  private pingSocket() {
    if (this.connection.readyState === WSWebSocket.CONNECTING) {
      const openTimeLimit = Date.now() - this.openTimeout;
      if (this.lastMessageTime < openTimeLimit) {
        this.connection.terminate();
      }
      return;
    }

    const lastMessageLimit = Date.now() - this.pingResponseTimeout;

    if (this.lastMessageTime < lastMessageLimit) {
      logError("TerminatingSocket", {
        delay: lastMessageLimit - this.lastMessageTime,
        timeout: this.pingResponseTimeout,
      });
      this.connection.terminate();
      return;
    }

    if (this.connection.readyState === WSWebSocket.OPEN) {
      this.connection.ping();
    }
  }

  isOpen() {
    const { readyState } = this.connection;
    // Since sendData will queue up messages until the connection opens, we consider
    // CONNECTING to be an open state as well.
    return readyState === WSWebSocket.CONNECTING || readyState === WSWebSocket.OPEN;
  }

  close(code: CloseCode = CloseCode.Normal) {
    this.connection.close(code, getCodeReason(code));
  }

  forward(message: Message) {
    assert(message instanceof Message, "expected a message");
    this.sendData(message.text, message.data);
  }

  send(msg: MessageObject, data: Buffer | null = null, callback?: (e: unknown) => void) {
    assert(typeof msg === "object" && msg !== null, "message must be an object");
    assert(!(msg instanceof Buffer), "message object must a simple JSON object");
    assert(typeof msg.binary === "boolean" || msg.binary === undefined);
    assert(!data || data instanceof Buffer, "websocket outgoing data must be a Buffer");
    if (msg.binary === true) {
      assert(data, "cannot send binary === true message with no data");
    } else {
      assert(!data, "cannot send binary !== true message with data");
    }

    this.sendData(JSON.stringify(msg), data, callback);
  }

  private sendData(text: string, data: Buffer | null, callback?: (e: unknown) => void) {
    const { readyState } = this.connection;
    switch (readyState) {
      case WSWebSocket.CONNECTING:
        this.pendingMessages.push({ text, data, callback });
        return;
      case WSWebSocket.OPEN:
        break;
      case WSWebSocket.CLOSING:
      case WSWebSocket.CLOSED:
        break;
      default:
        logError("UnknownReadyState");
        break;
    }

    if (data) {
      this.connection.send(text);
      this.connection.send(data, callback);
    } else {
      this.connection.send(text, callback);
    }
  }

  private onOpen() {
    this.lastMessageTime = Date.now();
    for (const { text, data, callback } of this.pendingMessages) {
      this.sendData(text, data, callback);
    }
    this.pendingMessages = [];

    this.emit("open");
  }

  private onClose(code: number, reason: string) {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.pendingBinaryMessage) {
      this.pendingBinaryMessage = null;

      if (code === 1000) {
        // If the connection didn't close cleanly there's not much reason to
        // expect any missing binary messages anyway.
        this.emit("error", new Error("Server closed cleaning with pending binary message"));
      }
    }

    this.emit("close", code, reason);
  }

  private onError(err: WSWebSocket.ErrorEvent) {
    this.emit("error", err);
  }

  private onPong() {
    this.lastMessageTime = Date.now();
  }

  private onMessage(data: string | Buffer) {
    this.lastMessageTime = Date.now();

    if (this.pendingBinaryMessage) {
      const { text, msg } = this.pendingBinaryMessage;
      this.pendingBinaryMessage = null;

      if (typeof data !== "string") {
        this.emit("message", new Message(text, msg, data));
        return;
      }

      this.close(CloseCode.MissingBinaryMessage);
      return;
    }

    if (typeof data !== "string") {
      this.close(CloseCode.UnexpectedBinaryMessage);
      return;
    }

    let json;
    try {
      json = JSON.parse(data);
    } catch (err) {
      this.close(CloseCode.InvalidJSONMessage);
      return;
    }

    if (typeof json !== "object" || json === null) {
      this.close(CloseCode.InvalidObjectMessage);
      return;
    }

    if (json.binary !== undefined && typeof json.binary !== "boolean") {
      this.close(CloseCode.InvalidBinaryPropery);
      return;
    }

    if (json.binary === true) {
      this.pendingBinaryMessage = { text: data, msg: json };
      return;
    }

    this.emit("message", new Message(data, json, null));
  }
}
