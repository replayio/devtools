import { PauseId } from "@replayio/protocol";

import { framesCache } from "replay-next/src/suspense/FrameCache";
import { frameStepsCache } from "replay-next/src/suspense/FrameStepsCache";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { ReplayClientInterface } from "shared/client/types";
import { FocusWindow } from "ui/state/timeline";

// returns undefined if the async parent pause doesn't exist
// or null if it is not in a loaded region
export function getAsyncParentPauseIdSuspense(
  replayClient: ReplayClientInterface,
  pauseId: PauseId,
  asyncIndex: number,
  focusWindow: FocusWindow
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

    const executionPoint = steps[0].point;
    if (
      focusWindow === null ||
      focusWindow.begin.point > executionPoint ||
      focusWindow.end.point < executionPoint
    ) {
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
