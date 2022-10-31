import { Frame, PauseId } from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";

import { createGenericCache2 } from "./createGenericCache";
import { cachePauseData, sortFramesAndUpdateLocations } from "./PauseCache";

export const {
  getValueSuspense: getFramesSuspense,
  getValueAsync: getFramesAsync,
  getValueIfCached: getFramesIfCached,
  addValue: cacheFrames,
} = createGenericCache2<ReplayClientInterface, [pauseId: PauseId], Frame[] | undefined>(
  async (client, pauseId) => {
    const framesResult = await client.getAllFrames(pauseId);
    await client.ensureSourcesLoaded();

    // this will not cache the frames because we're not passing in framesResult.frames,
    // the frames will instead be cached when they're returned from this function
    cachePauseData(client, pauseId, framesResult.data);

    if (framesResult.data.frames) {
      return sortFramesAndUpdateLocations(client, framesResult.data.frames, framesResult.frames);
    }
  },
  pauseId => pauseId
);
