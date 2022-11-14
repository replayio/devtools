import { PauseId, TimeStampedPointRange } from "@replayio/protocol";

import { getFramesSuspense } from "bvaughn-architecture-demo/src/suspense/FrameCache";
import { getFrameStepsSuspense } from "bvaughn-architecture-demo/src/suspense/FrameStepsCache";
import { ThreadFront } from "protocol/thread";
import { ReplayClientInterface } from "shared/client/types";
import { isPointInRegions } from "ui/utils/timeline";

export function getPauseIdForPointSuspense(point: string, time: number): PauseId {
  const pause = ThreadFront.ensurePause(point, time);
  if (pause.pauseId) {
    return pause.pauseId;
  } else {
    throw pause.createWaiter;
  }
}

// returns undefined if the async parent pause doesn't exist
// or null if it is not in a loaded region
export function getAsyncParentPauseIdSuspense(
  replayClient: ReplayClientInterface,
  pauseId: PauseId,
  asyncIndex: number,
  loadedRegions: TimeStampedPointRange[]
): PauseId | null | undefined {
  while (asyncIndex > 0) {
    const frames = getFramesSuspense(replayClient, pauseId)!;
    if (!frames?.length) {
      return;
    }
    const steps = getFrameStepsSuspense(replayClient, pauseId, frames[frames.length - 1].frameId);
    if (!steps?.length) {
      return;
    }
    if (!isPointInRegions(loadedRegions, steps[0].point)) {
      return null;
    }
    const parentPauseId = getPauseIdForPointSuspense(steps[0].point, steps[0].time);
    if (parentPauseId === pauseId) {
      return;
    }
    pauseId = parentPauseId;
    asyncIndex--;
  }
  return pauseId;
}
