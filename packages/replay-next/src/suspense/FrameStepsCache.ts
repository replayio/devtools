import { FrameId, Location, PauseId, PointDescription } from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";

import { ReplayClientInterface } from "shared/client/types";

import { createGenericCache, createUseGetValue } from "./createGenericCache";
import { updateMappedLocation } from "./PauseCache";

export const {
  getValueSuspense: getFrameStepsSuspense,
  getValueAsync: getFrameStepsAsync,
  getValueIfCached: getFrameStepsIfCached,
  getCacheKey,
} = createGenericCache<
  [replayClient: ReplayClientInterface],
  [pauseId: PauseId, frameId: FrameId],
  PointDescription[] | undefined
>(
  "FrameStepsCache: getFrameSteps",
  1,
  async (client, pauseId, frameId) => {
    try {
      const frameSteps = await client.getFrameSteps(pauseId, frameId);
      const updatedFrameSteps = cloneDeep(frameSteps);
      for (const frameStep of updatedFrameSteps) {
        if (frameStep.frame) {
          updateMappedLocation(client, frameStep.frame);
        }
      }
      return updatedFrameSteps;
    } catch (err) {
      return undefined;
    }
  },
  (pauseId, frameId) => `${pauseId}:${frameId}`
);

export const useGetFrameSteps = createUseGetValue<
  [replayClient: ReplayClientInterface, pauseId: PauseId | undefined, frameId: FrameId | undefined],
  PointDescription[] | undefined
>(
  async (replayClient, pauseId, frameId) =>
    pauseId && frameId ? await getFrameStepsAsync(replayClient, pauseId, frameId) : undefined,
  (replayClient, pauseId, frameId) =>
    pauseId && frameId ? getFrameStepsIfCached(pauseId, frameId) : { value: undefined },
  (replayClient, pauseId, frameId) => getCacheKey(pauseId!, frameId!)
);

export async function getFrameStepForFrameLocation(
  replayClient: ReplayClientInterface,
  pauseId: string,
  protocolFrameId: string,
  location: Location
) {
  const frameSteps = await getFrameStepsAsync(replayClient, pauseId, protocolFrameId);

  const matchingFrameStep = frameSteps?.find(step => {
    return step.frame?.find(location => {
      return location.sourceId === location.sourceId && location.line === location.line;
    });
  });

  return matchingFrameStep;
}
