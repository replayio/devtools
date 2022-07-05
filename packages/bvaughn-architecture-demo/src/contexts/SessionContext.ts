import { ExecutionPoint, SourceId } from "@replayio/protocol";
import { createContext } from "react";
import { UserInfo } from "../graphql/types";

export type SessionContextType = {
  accessToken: string | null;
  currentUserInfo: UserInfo | null;
  duration: number;
  endPoint: ExecutionPoint;
  recordingId: string;
  sessionId: string;
  sourceIds: SourceId[];
};

export const SessionContext = createContext<SessionContextType>(null as any);
