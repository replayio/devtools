import { Frame, FrameId, PauseId } from "@replayio/protocol";

import { assert } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";

import { createGenericCache } from "./createGenericCache";
import { cachePauseData } from "./PauseCache";

export const {
  getValueSuspense: getFramesSuspense,
  getValueAsync: getFramesAsync,
  getValueIfCached: getFramesIfCached,
  addValue: cacheFrames,
} = createGenericCache<
  [replayClient: ReplayClientInterface],
  [pauseId: PauseId],
  Frame[] | undefined
>(
  "FrameCache: getFrames",
  1,
  async (client, pauseId) => {
    const framesResult = await client.getAllFrames(pauseId);
    await client.waitForLoadedSources();
    cachePauseData(client, pauseId, framesResult.data, framesResult.frames);
    const cached: { value: Frame[] | undefined } | undefined = getFramesIfCached(pauseId);
    assert(cached, `Frames for pause ${pauseId} not found in cache`);
    return cached.value;
  },
  pauseId => pauseId
);

export function getFrameSuspense(
  replayClient: ReplayClientInterface,
  pauseId: PauseId,
  frameId: FrameId
) {
  const frames = getFramesSuspense(replayClient, pauseId);
  return frames?.find(frame => frame.frameId === frameId);
}
