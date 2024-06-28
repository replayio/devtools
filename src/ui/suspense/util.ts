import { PauseId, TimeStampedPointRange } from "@replayio/protocol";

import { framesCache } from "replay-next/src/suspense/FrameCache";
import { frameStepsCache } from "replay-next/src/suspense/FrameStepsCache";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { isExecutionPointsWithinRange } from "replay-next/src/utils/time";
import { ReplayClientInterface } from "shared/client/types";

// returns false if the async parent pause doesn't exist
// or true if it is not in a loaded region
export function getAsyncParentPauseIdSuspense(
  replayClient: ReplayClientInterface,
  pauseId: PauseId,
  asyncIndex: number,
  focusWindow: TimeStampedPointRange | null
): PauseId | boolean {
  while (asyncIndex > 0) {
    const frames = framesCache.read(replayClient, pauseId)!;
    if (!frames?.length) {
      return false;
    }

    const steps = frameStepsCache.read(replayClient, pauseId, frames[frames.length - 1].frameId);
    if (!steps || steps.length === 0) {
      return false;
    }

    const executionPoint = steps[0].point;
    if (
      focusWindow &&
      !isExecutionPointsWithinRange(executionPoint, focusWindow.begin.point, focusWindow.end.point)
    ) {
      return true;
    }

    const parentPauseId = pauseIdCache.read(replayClient, steps[0].point, steps[0].time);
    if (parentPauseId === pauseId) {
      return false;
    }

    pauseId = parentPauseId;
    asyncIndex--;
  }
  return pauseId;
}
