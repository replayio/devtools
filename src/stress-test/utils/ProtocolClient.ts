/* Copyright 2022 Record Replay Inc. */

// Simple protocol client for use in writing standalone applications.

import assert from "assert";
import { defer, Deferred } from "./promise";
import { Message } from "./websocket";
import {
  CommandMethods,
  CommandParams,
  CommandResult,
  EventMethods,
  EventParams,
  EventListeners,
} from "@recordreplay/protocol";

export type ClientCallbacks = {
  onClose: (code: number, reason: string) => void;
  onError: (e: unknown) => void;
};

export default class ProtocolClient {
  socket: WebSocket;
  callbacks: ClientCallbacks;

  // Internal state.
  eventListeners: Partial<EventListeners> = {};
  pendingMessages = new Map<number, Deferred<CommandResult<CommandMethods>>>();
  nextMessageId = 1;
  opened: Deferred<boolean>;

  constructor(address: string, callbacks: ClientCallbacks) {
    this.socket = new WebSocket(address);
    this.callbacks = callbacks;
    this.opened = defer();

    console.log(`>> creating client`);
    this.socket.addEventListener("close", callbacks.onClose);
    this.socket.addEventListener("error", callbacks.onError);
    this.socket.addEventListener("message", message => this.onMessage(message));
    this.socket.addEventListener("open", () => {
      console.log("opened");
      this.opened.resolve(true);
    });
  }

  close() {
    this.socket.close();
  }

  addEventListener<M extends EventMethods>(event: M, listener: (params: EventParams<M>) => void) {
    this.eventListeners[event] = listener;
  }

  async sendCommand<M extends CommandMethods>(
    method: M,
    params: CommandParams<M>,
    sessionId?: string,
    pauseId?: string
  ): Promise<CommandResult<M>> {
    await this.opened.promise;

    const id = this.nextMessageId++;
    this.socket.send({ id, method, params, sessionId, pauseId });
    const waiter = defer<CommandResult<M>>();
    this.pendingMessages.set(id, waiter);
    return waiter.promise;
  }

  async sendCommandWithData<M extends CommandMethods>(
    method: M,
    params: CommandParams<M>,
    data: Buffer,
    sessionId?: string,
    pauseId?: string
  ): Promise<CommandResult<M>> {
    const id = this.nextMessageId++;
    this.socket.send({ id, method, params, sessionId, pauseId, binary: true }, data);
    const waiter = defer<CommandResult<M>>();
    this.pendingMessages.set(id, waiter);
    return waiter.promise;
  }

  onMessage({ msg }: Message) {
    if (msg.id) {
      const { resolve, reject } = this.pendingMessages.get(msg.id as number)!;
      this.pendingMessages.delete(msg.id as number);
      if (msg.result) {
        resolve(msg.result as any);
      } else {
        reject(msg.error);
      }
    } else {
      assert(typeof msg.method === "string");
      assert(typeof msg.params === "object" && msg.params);

      const handler = this.eventListeners[msg.method as EventMethods];
      if (handler) {
        handler({ ...msg.params } as any);
      } else {
        console.error("MissingMessageHandler", { method: msg.method });
      }
    }
  }
}
