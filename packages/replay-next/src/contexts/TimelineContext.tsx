import { ExecutionPoint, Location, PauseId } from "@replayio/protocol";
import { createContext } from "react";

export type TimelineContextType = {
  executionPoint: ExecutionPoint | null;
  isPending: boolean;
  pauseId: PauseId | null;
  time: number;
  update: (
    time: number,
    executionPoint: ExecutionPoint,
    openSource: boolean,
    location?: Location
  ) => void;
};

export const TimelineContext = createContext<TimelineContextType>(null as any);
