import { Frame, FrameId, PauseId } from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { assert } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";

import { cachePauseData, sortFramesAndUpdateLocations } from "./PauseCache";

export const framesCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId],
  Frame[] | undefined
> = createCache({
  debugLabel: "FramesCache",
  getKey: ([client, pauseId]) => pauseId,
  load: async ([client, pauseId]) => {
    const framesResult = await client.getAllFrames(pauseId);
    await client.waitForLoadedSources();
    cachePauseData(client, pauseId, framesResult.data, framesResult.frames);
    const cached = framesCache.getValueIfCached(client, pauseId);
    assert(cached, `Frames for pause ${pauseId} not found in cache`);
    return cached;
  },
});

export function getFrameSuspense(
  replayClient: ReplayClientInterface,
  pauseId: PauseId,
  frameId: FrameId
) {
  const frames = framesCache.read(replayClient, pauseId);
  return frames?.find(frame => frame.frameId === frameId);
}

export const topFrameCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId],
  Frame | undefined
> = createCache({
  debugLabel: "TopFrame",
  getKey: ([client, pauseId]) => pauseId,
  load: async ([client, pauseId]) => {
    // In most cases, we probably already have a full set of frames cached for this pause ID.
    // Try to use the first frame from there if possible.
    const existingCachedFrames = framesCache.getValueIfCached(client, pauseId);
    if (existingCachedFrames) {
      return existingCachedFrames[0];
    }

    // Otherwise, we'll use a lighter-weight `Pause.getTopFrame` request. The object
    // that comes back _should_ be the same either way.
    const framesResult = await client.getTopFrame(pauseId);
    const { frame: frameId } = framesResult;

    if (frameId === undefined) {
      return;
    }
    await client.waitForLoadedSources();
    // We _don't_ want to pass in a `stack` arg here. That will result in this frame
    // being added to the "all frames cache" as the cached value for this pause ID.
    // If someone asks for _all_ frames for the pause later, that would prevent the
    // full list of frames from being fetched.
    cachePauseData(client, pauseId, framesResult.data);
    const updatedFrames = sortFramesAndUpdateLocations(client, framesResult.data?.frames ?? [], [
      frameId,
    ]);

    // Instead, we'll update the locations in this frame ourselves.
    const topFrame = updatedFrames?.find(frame => frame.frameId === frameId);

    assert(topFrame, `Top frame for pause ${pauseId} not found in cache`);
    return topFrame;
  },
});
