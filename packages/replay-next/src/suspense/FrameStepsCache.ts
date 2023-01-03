import { FrameId, PauseId, PointDescription } from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";

import { ReplayClientInterface } from "shared/client/types";

import { createGenericCache2, createUseGetValue } from "./createGenericCache";
import { updateMappedLocation } from "./PauseCache";

export const {
  getValueSuspense: getFrameStepsSuspense,
  getValueAsync: getFrameStepsAsync,
  getValueIfCached: getFrameStepsIfCached,
} = createGenericCache2<
  ReplayClientInterface,
  [pauseId: PauseId, frameId: FrameId],
  PointDescription[] | undefined
>(
  "FrameStepsCache: getFrameSteps",
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
  (replayClient, pauseId, frameId) => `${pauseId}:${frameId}`
);
