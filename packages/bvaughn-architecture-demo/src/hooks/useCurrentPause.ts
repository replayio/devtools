import { createPauseResult as Pause } from "@replayio/protocol";
import { useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { isPointInRegions } from "shared/utils/time";

import { TimelineContext } from "../contexts/TimelineContext";
import { getPauseForExecutionPointSuspense } from "../suspense/PauseCache";

import useLoadedRegions from "./useRegions";

export default function useCurrentPause(): Pause | null {
  const client = useContext(ReplayClientContext);
  const loadedRegions = useLoadedRegions(client);

  const { executionPoint } = useContext(TimelineContext);

  // If we are not currently paused at an explicit point, find the nearest point and pause there.
  const isLoaded = loadedRegions !== null && isPointInRegions(executionPoint, loadedRegions.loaded);
  if (isLoaded) {
    const pause = getPauseForExecutionPointSuspense(client, executionPoint);

    return pause;
  }

  return null;
}
