import { ExecutionPoint } from "@replayio/protocol";
import { createContext } from "react";

export type SessionContextType = {
  duration: number;
  endPoint: ExecutionPoint;
  recordingId: string;
  sessionId: string;
};

export const SessionContext = createContext<SessionContextType>(null as any);
