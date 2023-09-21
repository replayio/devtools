import { FrameId, Location, PauseId, PointDescription, Value } from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";
import { Cache, createCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";

import { cachePauseData, updateMappedLocation } from "./PauseCache";
import { sourcesByIdCache } from "./SourcesCache";

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
      const sources = await sourcesByIdCache.readAsync(client);
      const updatedFrameSteps = cloneDeep(frameSteps);
      for (const frameStep of updatedFrameSteps) {
        if (frameStep.frame) {
          updateMappedLocation(sources, frameStep.frame);
        }
      }
      return updatedFrameSteps;
    } catch (err) {
      return undefined;
    }
  },
});

export const frameArgumentsCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId, frameId: FrameId],
  Value[] | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "frameArgumentsCache",
  getKey: ([client, pauseId, frameId]) => `${pauseId}:${frameId}`,
  load: async ([client, pauseId, frameId]) => {
    try {
      const { data, argumentValues } = await client.getFrameArguments(pauseId, frameId);

      const sources = await sourcesByIdCache.readAsync(client);
      cachePauseData(client, sources, pauseId, data);

      return argumentValues;
    } catch (err) {
      return undefined;
    }
  },
});
