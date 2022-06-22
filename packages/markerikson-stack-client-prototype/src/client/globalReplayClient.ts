// By default, this context wires the app up to use real Replay backend APIs.

import { SessionId } from "@replayio/protocol";
import { ThreadFront } from "protocol/thread";
import { ReplayClient } from "shared/client/ReplayClient";

// We can leverage this when writing tests (or UI demos) by injecting a stub client.
let DISPATCH_URL = "wss://dispatch.replay.io";
if (typeof window !== "undefined") {
  const url = new URL(window.location.href);
  if (url.searchParams.has("dispatch")) {
    DISPATCH_URL = url.searchParams.get("dispatch") as string;
  }
}

const globalReplayClient = new ReplayClient(DISPATCH_URL, ThreadFront);

export default globalReplayClient;

export function getReplaySessionId(): SessionId {
  // @ts-ignore
  return globalReplayClient.getSessionIdThrows();
}
