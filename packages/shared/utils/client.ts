import { ThreadFront } from "protocol/thread";
import createReplayClientPlayer from "shared/client/createReplayClientPlayer";
import createReplayClientRecorder from "shared/client/createReplayClientRecorder";
import { decode } from "shared/client/encoder";
import { ReplayClient } from "shared/client/ReplayClient";
import { ReplayClientInterface } from "shared/client/types";

import { hasFlag } from "./url";

// By default, this context wires the app up to use real Replay backend APIs.
// We can leverage this when writing tests (or UI demos) by injecting a stub client.
let DISPATCH_URL = process.env.DISPATCH_ADDRESS || "wss://dispatch.replay.io";
if (typeof window !== "undefined") {
  const url = new URL(window.location.href);
  if (url.searchParams.has("dispatch")) {
    DISPATCH_URL = url.searchParams.get("dispatch") as string;
  }
}

export function createReplayClientForProduction(): ReplayClientInterface {
  return new ReplayClient(DISPATCH_URL, ThreadFront);
}

export function createReplayClientForPlaywrightTesting(encoded: string): ReplayClientInterface {
  const recordData = hasFlag("record");
  if (recordData) {
    const replayClient = createReplayClientForProduction();
    return createReplayClientRecorder(replayClient);
  } else {
    const decoded = decode(encoded);
    return createReplayClientPlayer(decoded);
  }
}
