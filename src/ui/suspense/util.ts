import { PauseId, TimeStampedPointRange } from "@replayio/protocol";

import { framesCache } from "replay-next/src/suspense/FrameCache";
import { frameStepsCache } from "replay-next/src/suspense/FrameStepsCache";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { ReplayClientInterface } from "shared/client/types";
import { isPointInRegions } from "ui/utils/timeline";

// returns undefined if the async parent pause doesn't exist
// or null if it is not in a loaded region
export function getAsyncParentPauseIdSuspense(
  replayClient: ReplayClientInterface,
  pauseId: PauseId,
  asyncIndex: number,
  loadedRegions: TimeStampedPointRange[]
): PauseId | null | undefined {
  while (asyncIndex > 0) {
    const frames = framesCache.read(replayClient, pauseId)!;
    if (!frames?.length) {
      return;
    }
    const steps = frameStepsCache.read(replayClient, pauseId, frames[frames.length - 1].frameId);
    if (!steps || steps.length === 0) {
      return;
    }
    if (!isPointInRegions(loadedRegions, steps[0].point)) {
      return null;
    }
    const parentPauseId = pauseIdCache.read(replayClient, steps[0].point, steps[0].time);
    if (parentPauseId === pauseId) {
      return;
    }
    pauseId = parentPauseId;
    asyncIndex--;
  }
  return pauseId;
}
