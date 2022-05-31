import { ExecutionPoint } from "@replayio/protocol";
import { ThreadFront } from "protocol/thread";
import { createContext } from "react";
import { ReplayClient, ReplayClientInterface } from "./ReplayClient";

import { Range } from "./types";

export type ConsoleLevelFlags = {
  showErrors: boolean;
  showLogs: boolean;
  showWarnings: boolean;
};

export type ConsoleFiltersContextType = {
  // Filter text to display in the UI.
  // This value is updated at React's default, higher priority.
  filterByDisplayText: string;

  // Text to filter console messages by.
  // This value is updated at a lower, transition priority.
  filterByText: string;

  // Filter by text is about to be updated as part of a transition;
  // UI that consumes the focus for Suspense purposes may wish want reflect the temporary pending state.
  isTransitionPending: boolean;

  // Types of console messages to include (or filter out).
  levelFlags: ConsoleLevelFlags;

  update: (filterByText: string, levelFlags: ConsoleLevelFlags) => void;
};
export const ConsoleFiltersContext = createContext<ConsoleFiltersContextType>(null as any);

export type FocusContextType = {
  // Focus is about to be updated as part of a transition;
  // UI that consumes the focus for Suspense purposes may wish want reflect the temporary pending state.
  isTransitionPending: boolean;
  range: Range | null;
  rangeForDisplay: Range | null;
  update: (value: Range | null, debounce: boolean) => void;
};
export const FocusContext = createContext<FocusContextType>(null as any);

export type SessionContextType = {
  duration: number;
  endPoint: ExecutionPoint;
  recordingId: string;
  sessionId: string;
};
export const SessionContext = createContext<SessionContextType>(null as any);

export type ReplayClientContextType = ReplayClientInterface;

// By default, this context wires the app up to use real Replay backend APIs.
// We can leverage this when writing tests (or UI demos) by injecting a stub client.
const DISPATCH_URL = "wss://dispatch.replay.io";
export const ReplayClientContext = createContext<ReplayClientContextType>(
  new ReplayClient(DISPATCH_URL, ThreadFront)
);
