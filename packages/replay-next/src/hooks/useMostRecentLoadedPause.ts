import { ExecutionPoint, PauseId } from "@replayio/protocol";
import { useContext, useRef } from "react";

import { TimelineContext } from "../contexts/TimelineContext";

interface LoadedPause {
  pauseId: PauseId;
  point: ExecutionPoint;
  time: number;
}

export function useMostRecentLoadedPause(): LoadedPause | null {
  const pauseRef = useRef<LoadedPause | null>(null);
  const { executionPoint: point, pauseId, time } = useContext(TimelineContext);
  if (point && pauseId && pauseId !== pauseRef.current?.pauseId) {
    pauseRef.current = { pauseId, point, time };
  }
  return pauseRef.current;
}
