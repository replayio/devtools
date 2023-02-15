import { createContext } from "react";

import { UserInfo } from "shared/graphql/types";

export type TrackEvent = (event: string, ...args: any[]) => void;

export type SessionContextType = {
  accessToken: string | null;
  currentUserInfo: UserInfo | null;
  duration: number;
  recordingId: string;
  sessionId: string;
  refetchUser: () => void;
  trackEvent: TrackEvent;
  trackEventOnce: TrackEvent;
};

export const SessionContext = createContext<SessionContextType>(null as any);
