import { ExecutionPoint } from "@replayio/protocol";
import { createContext } from "react";

import { UserInfo } from "shared/graphql/types";

export type TrackEvent = (event: string, ...args: any[]) => void;

// Only primitive fields, so that refetching the user (e.g. after dismissing a nag) leaves the
// context unchanged unless the user did change. Nags are provided by NagsContext.
export type SessionUserInfo = Pick<UserInfo, "email" | "id" | "name" | "picture">;

export type SessionContextType = {
  accessToken: string | null;
  currentUserInfo: SessionUserInfo | null;
  duration: number;
  endpoint: ExecutionPoint;
  recordingId: string;
  sessionId: string;
  refetchUser: () => void;
  trackEvent: TrackEvent;
  trackEventOnce: TrackEvent;
};

export const SessionContext = createContext<SessionContextType>(null as any);
