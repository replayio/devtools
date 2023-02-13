import { createContext } from "react";

import { UserInfo } from "shared/graphql/types";

export type SessionContextType = {
  accessToken: string | null;
  currentUserInfo: UserInfo | null;
  duration: number;
  recordingId: string;
  sessionId: string;
  refetchUser: () => void;
  trackEvent: (event: string, ...args: any[]) => void;
  trackEventOnce: (event: string, ...args: any[]) => void;
};

export const SessionContext = createContext<SessionContextType>(null as any);
