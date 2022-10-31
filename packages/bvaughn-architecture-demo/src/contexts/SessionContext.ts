import { createContext } from "react";
import { UserInfo } from "../graphql/types";

export type SessionContextType = {
  accessToken: string | null;
  currentUserInfo: UserInfo | null;
  duration: number;
  recordingId: string;
  sessionId: string;
  refetchUser: () => void;
};

export const SessionContext = createContext<SessionContextType>(null as any);
