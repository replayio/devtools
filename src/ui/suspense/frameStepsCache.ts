import { FrameId, PauseId, PointDescription } from "@replayio/protocol";
import { createGenericCache } from "bvaughn-architecture-demo/src/suspense/createGenericCache";
import { Pause } from "protocol/thread/pause";
import { assert } from "protocol/utils";

export const {
  getValueSuspense: getFrameStepsSuspense,
  getValueAsync: getFrameStepsAsync,
  getValueIfCached: getFrameStepsIfCached,
} = createGenericCache<[pauseId: PauseId, frameId: FrameId], PointDescription[]>(
  (pauseId, frameId) => {
    const pause = Pause.getById(pauseId);
    assert(pause, `no pause for ${pauseId}`);
    return pause.getFrameSteps(frameId);
  },
  (pauseId, frameId) => `${pauseId}:${frameId}`
);
