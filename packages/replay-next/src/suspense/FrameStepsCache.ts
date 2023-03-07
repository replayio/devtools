import { FrameId, Location, PauseId, PointDescription } from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";
import { createCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";

import { updateMappedLocation } from "./PauseCache";

export const {
  getValueIfCached: getFrameStepsIfCached,
  read: getFrameStepsSuspense,
  readAsync: getFrameStepsAsync,
} = createCache<
  [pauseId: PauseId, frameId: FrameId, replayClient: ReplayClientInterface],
  PointDescription[] | undefined
>({
  debugLabel: "FrameStepsCache: getFrameSteps",
  load: async (pauseId, frameId, client) => {
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
  const frameSteps = await getFrameStepsAsync(pauseId, protocolFrameId, replayClient);

  const matchingFrameStep = frameSteps?.find(step => {
    return step.frame?.find(location => {
      return location.sourceId === location.sourceId && location.line === location.line;
    });
  });

  return matchingFrameStep;
}
