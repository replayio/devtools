import { PauseId } from "@replayio/protocol";
import { ThreadFront } from "protocol/thread/thread";
import { SourcesState } from "ui/reducers/sources";
import { getFramesIfCached } from "ui/suspense/frameCache";
import { getFrameStepsIfCached } from "ui/suspense/frameStepsCache";
import { createFrame } from "../client/create";
import { PauseFrame } from "../selectors";
import { formatCallStackFrames } from "../selectors/getCallStackFrames";

// returns all cached frames from the given pauseId and its async parent pauseIds
// and converts them to PauseFrames
export function getAllCachedPauseFrames(
  pauseId: PauseId | undefined,
  sourcesState: SourcesState
): PauseFrame[] | undefined {
  if (!pauseId) {
    return undefined;
  }

  let allPauseFrames: PauseFrame[] = [];
  let asyncIndex = 0;
  while (true) {
    const cachedFrames = getFramesIfCached(pauseId);
    if (!cachedFrames?.value) {
      break;
    }
    let protocolFrames = cachedFrames.value;
    if (asyncIndex > 0) {
      protocolFrames = protocolFrames.slice(1);
    }
    const pauseFrames = formatCallStackFrames(
      protocolFrames.map((protocolFrame, index) =>
        createFrame(
          sourcesState,
          ThreadFront.preferredGeneratedSources,
          protocolFrame,
          pauseId!,
          index,
          asyncIndex
        )
      ) || null,
      sourcesState.sourceDetails.entities
    );
    if (!pauseFrames?.length) {
      break;
    }
    allPauseFrames = allPauseFrames.concat(pauseFrames);

    const steps = getFrameStepsIfCached(pauseId, pauseFrames[pauseFrames.length - 1].protocolId);
    if (!steps?.value?.length) {
      break;
    }
    const asyncParentPause = ThreadFront.ensurePause(steps.value[0].point, steps.value[0].time);
    if (!asyncParentPause.pauseId || asyncParentPause.pauseId === pauseId) {
      break;
    }
    pauseId = asyncParentPause.pauseId;
    asyncIndex++;
  }

  return allPauseFrames;
}
