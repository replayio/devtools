import { ThreadFront } from "protocol/thread";
import { createContext } from "react";
import { ReplayClient, ReplayClientInterface } from "../ReplayClient";

export type ReplayClientContextType = ReplayClientInterface;

// By default, this context wires the app up to use real Replay backend APIs.
// We can leverage this when writing tests (or UI demos) by injecting a stub client.
const DISPATCH_URL = "wss://dispatch.replay.io";
export const ReplayClientContext = createContext<ReplayClientContextType>(
  new ReplayClient(DISPATCH_URL, ThreadFront)
);
