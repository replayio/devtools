import { PauseId } from "@replayio/protocol";

import { ThreadFront } from "protocol/thread/thread";
import { frameStepsCache } from "replay-next/src/suspense/FrameStepsCache";
import { getPauseIdForExecutionPointIfCached } from "replay-next/src/suspense/PauseCache";
import { SourcesState } from "ui/reducers/sources";
import { getPauseFramesIfCached } from "ui/suspense/frameCache";

import { PauseFrame } from "../selectors";

// returns all cached frames from the given pauseId and its async parent pauseIds
// and converts them to PauseFrames
export function getAllCachedPauseFrames(
  pauseId: PauseId,
  sourcesState: SourcesState
): PauseFrame[] | undefined {
  let allPauseFrames: PauseFrame[] = [];
  let asyncIndex = 0;
  while (true) {
    const cachedFrames = getPauseFramesIfCached(pauseId, sourcesState);
    if (!cachedFrames) {
      break;
    }
    let pauseFrames = cachedFrames;
    if (asyncIndex > 0) {
      pauseFrames = pauseFrames.slice(1);
    }
    if (!pauseFrames?.length) {
      break;
    }
    allPauseFrames = allPauseFrames.concat(pauseFrames);

    const steps = frameStepsCache.getValueIfCached(
      null as any,
      pauseId,
      pauseFrames[pauseFrames.length - 1].protocolId
    );
    if (!steps || steps.length === 0) {
      break;
    }
    const asyncParentPauseId = getPauseIdForExecutionPointIfCached(steps[0].point)?.value;
    if (!asyncParentPauseId || asyncParentPauseId === pauseId) {
      break;
    }
    pauseId = asyncParentPauseId;
    asyncIndex++;
  }

  return allPauseFrames;
}
