import { ExecutionPoint } from "@replayio/protocol";
import { createContext } from "react";

import { UserInfo } from "shared/graphql/types";

export type SessionContextType = {
  accessToken: string | null;
  currentUserInfo: UserInfo | null;
  duration: number;
  endPoint: ExecutionPoint;
  recordingId: string;
  sessionId: string;
};

export const SessionContext = createContext<SessionContextType>(null as any);
