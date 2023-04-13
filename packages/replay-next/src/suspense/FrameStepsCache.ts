import { FrameId, Location, PauseId, PointDescription } from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";
import { Cache, createCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";

import { updateMappedLocation } from "./PauseCache";

export const frameStepsCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId, frameId: FrameId],
  PointDescription[] | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "frameStepsCache",
  getKey: ([client, pauseId, frameId]) => `${pauseId}:${frameId}`,
  load: async ([client, pauseId, frameId]) => {
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
});

export async function getFrameStepForFrameLocation(
  replayClient: ReplayClientInterface,
  pauseId: string,
  protocolFrameId: string,
  location: Location
) {
  const frameSteps = await frameStepsCache.readAsync(replayClient, pauseId, protocolFrameId);

  const matchingFrameStep = frameSteps?.find(step => {
    return step.frame?.find(location => {
      return location.sourceId === location.sourceId && location.line === location.line;
    });
  });

  return matchingFrameStep;
}
