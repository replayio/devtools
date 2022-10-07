import { Frame, PauseId } from "@replayio/protocol";
import { createGenericCache } from "bvaughn-architecture-demo/src/suspense/createGenericCache";
import { Pause } from "protocol/thread/pause";
import { assert } from "protocol/utils";

export const {
  getValueSuspense: getFramesSuspense,
  getValueAsync: getFramesAsync,
  getValueIfCached: getFramesIfCached,
} = createGenericCache<[pauseId: PauseId], Frame[] | undefined>(
  async pauseId => {
    const pause = Pause.getById(pauseId);
    assert(pause, `no pause for ${pauseId}`);
    const frames = await pause.getFrames();
    return frames;
  },
  pauseId => pauseId
);
