import { Frame, PauseId } from "@replayio/protocol";

import { assert } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";

import { createGenericCache2 } from "./createGenericCache";
import { cachePauseData } from "./PauseCache";

export const {
  getValueSuspense: getFramesSuspense,
  getValueAsync: getFramesAsync,
  getValueIfCached: getFramesIfCached,
  addValue: cacheFrames,
} = createGenericCache2<ReplayClientInterface, [pauseId: PauseId], Frame[] | undefined>(
  "FrameCache: getFrames",
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
