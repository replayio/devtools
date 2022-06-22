import { ThreadFront } from "protocol/thread";
import { ReplayClient, ReplayClientInterface } from "../client/ReplayClient";

// By default, this context wires the app up to use real Replay backend APIs.
// We can leverage this when writing tests (or UI demos) by injecting a stub client.
let DISPATCH_URL = process.env.DISPATCH_ADDRESS || "wss://dispatch.replay.io";
if (typeof window !== "undefined") {
  const url = new URL(window.location.href);
  if (url.searchParams.has("dispatch")) {
    DISPATCH_URL = url.searchParams.get("dispatch") as string;
  }
}

export default function createReplayClient(): ReplayClientInterface {
  return new ReplayClient(DISPATCH_URL, ThreadFront);
}
