import {
  CallStack,
  ExecutionPoint,
  Frame,
  FrameId,
  MappedLocation,
  PauseData,
  PauseId,
  Result,
} from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";
import { Cache, createCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";

import { framesCache } from "./FrameCache";
import { preCacheObjects } from "./ObjectPreviews";
import { scopesCache } from "./ScopeCache";

const pauseIdToPointAndTimeMap: Map<PauseId, [ExecutionPoint, number]> = new Map();

export const pauseIdCache: Cache<
  [replayClient: ReplayClientInterface, executionPoint: ExecutionPoint, time: number],
  PauseId
> = createCache({
  debugLabel: "PauseIdForExecutionPoint",
  getKey: ([replayClient, executionPoint, time]) => `${executionPoint}:${time}`,
  load: async ([replayClient, executionPoint, time]) => {
    const { data, pauseId, stack } = await replayClient.createPause(executionPoint);

    pauseIdToPointAndTimeMap.set(pauseId, [executionPoint, time]);

    await replayClient.waitForLoadedSources();

    cachePauseData(replayClient, pauseId, data, stack);

    return pauseId;
  },
});

export function getPointAndTimeForPauseId(
  pauseId: PauseId
): [ExecutionPoint | null, number | null] {
  return pauseIdToPointAndTimeMap.get(pauseId) ?? [null, null];
}

export const pauseEvaluationsCache: Cache<
  [
    replayClient: ReplayClientInterface,
    pauseId: PauseId,
    frameId: FrameId | null,
    expression: string,
    uid?: string
  ],
  Omit<Result, "data">
> = createCache({
  debugLabel: "PauseEvaluations",
  getKey: ([replayClient, pauseId, frameId, expression, uid = ""]) =>
    `${pauseId}:${frameId}:${expression}:${uid}`,
  load: async ([replayClient, pauseId, frameId, expression, uid = ""]) => {
    const result = await replayClient.evaluateExpression(pauseId, expression, frameId);
    await replayClient.waitForLoadedSources();
    cachePauseData(replayClient, pauseId, result.data);
    return { exception: result.exception, failed: result.failed, returned: result.returned };
  },
});

export function cachePauseData(
  client: ReplayClientInterface,
  pauseId: PauseId,
  pauseData: PauseData,
  stack?: CallStack
) {
  if (pauseData.objects) {
    preCacheObjects(pauseId, pauseData.objects);
  }
  if (stack) {
    const frames = sortFramesAndUpdateLocations(client, pauseData.frames || [], stack);
    if (frames) {
      framesCache.cache(frames, client, pauseId);
    }
  }
  if (pauseData.scopes) {
    for (const scope of pauseData.scopes) {
      scopesCache.cache(scope, client, pauseId, scope.scopeId);
    }
  }
}

export function sortFramesAndUpdateLocations(
  client: ReplayClientInterface,
  rawFrames: Frame[],
  stack: FrameId[]
) {
  const frames = stack.map(frameId => rawFrames?.find(frame => frame.frameId === frameId));
  if (frames.every(frame => !!frame)) {
    const updatedFrames = frames.map(frame => cloneDeep(frame!));
    for (const frame of updatedFrames) {
      updateMappedLocation(client, frame.location);
      if (frame!.functionLocation) {
        updateMappedLocation(client, frame.functionLocation);
      }
    }
    return updatedFrames;
  }
}

export function updateMappedLocation(
  client: ReplayClientInterface,
  mappedLocation: MappedLocation
) {
  for (const location of mappedLocation) {
    location.sourceId = client.getCorrespondingSourceIds(location.sourceId)[0];
  }
}
