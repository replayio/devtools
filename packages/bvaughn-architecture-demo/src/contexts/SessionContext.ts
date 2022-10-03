import { ExecutionPoint, SourceId } from "@replayio/protocol";
import { createContext } from "react";
import { UserInfo } from "../graphql/types";

export type SessionContextType = {
  accessToken: string | null;
  currentUserInfo: UserInfo | null;
  duration: number;
  recordingId: string;
  sessionId: string;
};

export const SessionContext = createContext<SessionContextType>(null as any);
