import { Frame, PauseId } from "@replayio/protocol";
import {
  createGenericCache,
  createUseGetValue,
} from "bvaughn-architecture-demo/src/suspense/createGenericCache";
import { Pause } from "protocol/thread/pause";
import { assert } from "protocol/utils";

export const {
  getValueSuspense: getFramesSuspense,
  getValueAsync: getFramesAsync,
  getValueIfCached: getFramesIfCached,
} = createGenericCache<[pauseId: PauseId], Frame[] | undefined>(
  pauseId => {
    const pause = Pause.getById(pauseId);
    assert(pause, `no pause for ${pauseId}`);
    return pause.getFrames();
  },
  pauseId => pauseId
);

export const useGetFrames = createUseGetValue<[pauseId: PauseId | undefined], Frame[] | undefined>(
  async pauseId => (pauseId ? await getFramesAsync(pauseId) : undefined),
  pauseId => (pauseId ? getFramesIfCached(pauseId) : { value: undefined }),
  pauseId => pauseId ?? ""
);
