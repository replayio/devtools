import {
  CallStack,
  ExecutionPoint,
  Frame,
  FrameId,
  MappedLocation,
  PauseData,
  PauseId,
  Result,
  SourceId,
  TimeStampedPoint,
} from "@replayio/protocol";
import * as Sentry from "@sentry/react";
import cloneDeep from "lodash/cloneDeep";
import { Cache, createCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";

import { getCorrespondingSourceIds } from "../utils/sources";
import { framesCache } from "./FrameCache";
import { preCacheObjects } from "./ObjectPreviews";
import { scopesCache } from "./ScopeCache";
import { Source, sourcesByIdCache } from "./SourcesCache";

const pauseIdToPointAndTimeMap: Map<PauseId, [ExecutionPoint, number]> = new Map();

export const pauseIdCache: Cache<
  [replayClient: ReplayClientInterface, executionPoint: ExecutionPoint, time: number],
  PauseId
> = createCache({
  config: { immutable: true },
  debugLabel: "PauseIdForExecutionPoint",
  getKey: ([replayClient, executionPoint, time]) => `${executionPoint}:${time}`,
  load: async ([replayClient, executionPoint, time]) => {
    const { pauseId } = await replayClient.createPause(executionPoint);

    pauseIdToPointAndTimeMap.set(pauseId, [executionPoint, time]);

    return pauseId;
  },
});

export function setPointAndTimeForPauseId(pauseId: PauseId, timeStampedPoint: TimeStampedPoint) {
  pauseIdToPointAndTimeMap.set(pauseId, [timeStampedPoint.point, timeStampedPoint.time]);
}

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
    uid?: string,
    pure?: boolean
  ],
  Omit<Result, "data">
> = createCache({
  config: { immutable: true },
  debugLabel: "PauseEvaluations",
  getKey: ([replayClient, pauseId, frameId, expression, uid = ""]) =>
    `${pauseId}:${frameId}:${expression}:${uid}`,
  load: async ([replayClient, pauseId, frameId, expression, uid = "", pure]) => {
    let result;
    try {
      result = await replayClient.evaluateExpression(pauseId, expression, frameId, pure);
    } catch (error) {
      Sentry.captureException(error, { extra: { expression, frameId, pauseId } });
      throw error;
    }
    const sources = await sourcesByIdCache.readAsync(replayClient);
    cachePauseData(replayClient, sources, pauseId, result.data);
    return { exception: result.exception, failed: result.failed, returned: result.returned };
  },
});

export function cachePauseData(
  client: ReplayClientInterface,
  sources: Map<SourceId, Source>,
  pauseId: PauseId,
  pauseData: PauseData,
  stack?: CallStack
) {
  if (pauseData.objects) {
    preCacheObjects(sources, pauseId, pauseData.objects);
  }
  if (stack) {
    const frames = sortFramesAndUpdateLocations(sources, pauseData.frames || [], stack);
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
  sources: Map<SourceId, Source>,
  rawFrames: Frame[],
  stack: FrameId[]
) {
  const frames = stack.map(frameId => rawFrames?.find(frame => frame.frameId === frameId));
  if (frames.every(frame => !!frame)) {
    const updatedFrames = frames.map(frame => cloneDeep(frame!));
    for (const frame of updatedFrames) {
      updateMappedLocation(sources, frame.location);
      if (frame!.functionLocation) {
        updateMappedLocation(sources, frame.functionLocation);
      }
    }
    return updatedFrames;
  }
}

export function updateMappedLocation(
  sources: Map<SourceId, Source>,
  mappedLocation: MappedLocation
) {
  for (const location of mappedLocation) {
    location.sourceId = getCorrespondingSourceIds(sources, location.sourceId)[0];
  }
}
