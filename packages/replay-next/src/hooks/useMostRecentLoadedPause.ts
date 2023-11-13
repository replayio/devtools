import { ExecutionPoint, PauseId } from "@replayio/protocol";
import { useContext, useRef } from "react";
import { useImperativeCacheValue } from "suspense";

import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { TimelineContext } from "../contexts/TimelineContext";
import { pauseIdCache } from "../suspense/PauseCache";

interface LoadedPause {
  pauseId: PauseId;
  point: ExecutionPoint;
  time: number;
}

export function useMostRecentLoadedPause(): LoadedPause | null {
  const client = useContext(ReplayClientContext);
  const pauseRef = useRef<LoadedPause | null>(null);
  const { executionPoint: point, time } = useContext(TimelineContext);
  const { status: pauseIdStatus, value: pauseId } = useImperativeCacheValue(
    pauseIdCache,
    client,
    point ?? "0",
    time
  );
  if (point && point !== pauseRef.current?.point && pauseIdStatus === "resolved") {
    pauseRef.current = { pauseId, point, time };
  }
  return pauseRef.current;
}
