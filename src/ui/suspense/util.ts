import { PauseId, TimeStampedPointRange } from "@replayio/protocol";
import { ThreadFront } from "protocol/thread";
import { isPointInRegions } from "ui/utils/timeline";
import { getFramesSuspense } from "./frameCache";
import { getFrameStepsSuspense } from "./frameStepsCache";

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
  pauseId: PauseId,
  asyncIndex: number,
  loadedRegions: TimeStampedPointRange[]
): PauseId | null | undefined {
  while (asyncIndex > 0) {
    const frames = getFramesSuspense(pauseId)!;
    if (!frames?.length) {
      return;
    }
    const steps = getFrameStepsSuspense(pauseId, frames[frames.length - 1].frameId);
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
