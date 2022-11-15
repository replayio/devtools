import { PauseId } from "@replayio/protocol";
import { useContext } from "react";

import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { isPointInRegions } from "shared/utils/time";

import { TimelineContext } from "../contexts/TimelineContext";
import { getPauseIdSuspense } from "../suspense/PauseCache";
import useLoadedRegions from "./useRegions";

export default function useCurrentPauseIdSuspense(): PauseId | null {
  const client = useContext(ReplayClientContext);
  const loadedRegions = useLoadedRegions(client);

  const { executionPoint, time } = useContext(TimelineContext);

  // If we are not currently paused at an explicit point, find the nearest point and pause there.
  const isLoaded = loadedRegions !== null && isPointInRegions(executionPoint, loadedRegions.loaded);
  if (isLoaded) {
    return getPauseIdSuspense(client, executionPoint, time);
  }

  return null;
}
