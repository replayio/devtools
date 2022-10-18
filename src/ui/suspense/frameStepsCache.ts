import { FrameId, PauseId, PointDescription } from "@replayio/protocol";
import {
  createGenericCache,
  createUseGetValue,
} from "bvaughn-architecture-demo/src/suspense/createGenericCache";
import { Pause } from "protocol/thread/pause";
import { assert } from "protocol/utils";

export const {
  getValueSuspense: getFrameStepsSuspense,
  getValueAsync: getFrameStepsAsync,
  getValueIfCached: getFrameStepsIfCached,
} = createGenericCache<[pauseId: PauseId, frameId: FrameId], PointDescription[] | undefined>(
  (pauseId, frameId) => {
    const pause = Pause.getById(pauseId);
    assert(pause, `no pause for ${pauseId}`);
    return pause.getFrameSteps(frameId);
  },
  (pauseId, frameId) => `${pauseId}:${frameId}`
);

export const useGetFrameSteps = createUseGetValue<
  [pauseId: PauseId | undefined, frameId: FrameId | undefined],
  PointDescription[] | undefined
>(
  async (pauseId, frameId) =>
    pauseId && frameId ? await getFrameStepsAsync(pauseId, frameId) : undefined,
  (pauseId, frameId) =>
    pauseId && frameId ? getFrameStepsIfCached(pauseId, frameId) : { value: undefined },
  (pauseId, frameId) => `${pauseId}:${frameId}`
);
