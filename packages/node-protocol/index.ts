import {
  CommandMethods,
  CommandParams,
  CommandResult,
  EventMethods,
  EventParams,
  PauseId,
  ProtocolClient,
  SessionId,
} from "@replayio/protocol";
import WebSocket from "ws";

import { defer } from "./utils";

const DEFAULT_ADDRESS = "wss://dispatch.replay.io";

interface Message {
  id: number;
  method: string;
  params: any;
  sessionId?: string;
  pauseId?: string;
}

interface MessageWaiter {
  method: string;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

type clientRes = { client: ProtocolClient; sendMessage: any; addEventListener: any };

export function createClient({
  address = DEFAULT_ADDRESS,
}: {
  address: string | undefined;
}): Promise<clientRes> {
  const { promise, resolve } = defer<clientRes>();
  function addEventListener<M extends EventMethods>(
    event: M,
    handler: (params: EventParams<M>) => void
  ) {
    gEventListeners.set(event, handler);
  }

  function removeEventListener() {}

  const gMessageWaiters = new Map<number, MessageWaiter>();
  const gEventListeners = new Map<string, (ev: any) => void>();
  let gSocketOpen: boolean;
  let gNextMessageId = 1;
  let gPendingMessages: Message[] = [];

  const socket = new WebSocket(address);
  socket.onopen = () => {
    console.log("socket open");
    gSocketOpen = true;
    resolve({ client, sendMessage, addEventListener });
  };
  socket.onclose = () => {
    console.log("onclose");
    gSocketOpen = false;
  };
  socket.onerror = () => console.log("onerror");

  socket.onmessage = evt => {
    const msg = JSON.parse(evt.data as any);
    if (msg.id) {
      const { method, resolve, reject } = gMessageWaiters.get(msg.id)!;

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
  };

  function sendMessage<M extends CommandMethods>(
    method: M,
    params: CommandParams<M>,
    sessionId?: SessionId,
    pauseId?: PauseId
  ): Promise<CommandResult<M>> {
    const id = gNextMessageId++;
    const msg = { id, sessionId, pauseId, method, params };

    if (gSocketOpen) {
      socket.send(JSON.stringify(msg));
    } else {
      gPendingMessages.push(msg);
    }

    const { promise, resolve, reject } = defer<any>();
    gMessageWaiters.set(id, { method, resolve, reject });

    return promise;
  }

  const client = new ProtocolClient({
    sendCommand: sendMessage,
    addEventListener,
    removeEventListener,
  });

  return promise;
}
