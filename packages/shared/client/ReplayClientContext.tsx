import { ThreadFront } from "protocol/thread";
import { createContext } from "react";

import { ReplayClient, ReplayClientInterface } from "../client/ReplayClient";

export type ReplayClientContextType = ReplayClientInterface;

// By default, this context wires the app up to use real Replay backend APIs.
// We can leverage this when writing tests (or UI demos) by injecting a stub client.
let DISPATCH_URL = process.env.DISPATCH_ADDRESS || "wss://dispatch.replay.io";
if (typeof window !== "undefined") {
  const url = new URL(window.location.href);
  if (url.searchParams.has("dispatch")) {
    DISPATCH_URL = url.searchParams.get("dispatch") as string;
  }
}

export const ReplayClientContext = createContext<ReplayClientContextType>(
  new ReplayClient(DISPATCH_URL, ThreadFront)
);
