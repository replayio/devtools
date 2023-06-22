import { PauseId } from "@replayio/protocol";
import { useContext } from "react";

import { useIsPointWithinFocusWindow } from "replay-next/src/hooks/useIsPointWithinFocusWindow";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { TimelineContext } from "../contexts/TimelineContext";
import { pauseIdCache } from "../suspense/PauseCache";

export default function useCurrentPauseIdSuspense(): PauseId | null {
  const client = useContext(ReplayClientContext);
  const { executionPoint, time } = useContext(TimelineContext);

  const isInFocusWindow = useIsPointWithinFocusWindow(executionPoint);
  if (!isInFocusWindow) {
    return null;
  }

  // If we are not currently paused at an explicit point, find the nearest point and pause there.
  return pauseIdCache.read(client, executionPoint, time);
}
