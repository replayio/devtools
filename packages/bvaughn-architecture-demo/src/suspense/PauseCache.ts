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

import { ReplayClientInterface } from "shared/client/types";

import { createGenericCache2 } from "./createGenericCache";
import { cacheFrames } from "./FrameCache";
import { preCacheObjects } from "./ObjectPreviews";
import { cacheScope } from "./ScopeCache";

const callStacksByPauseId: Map<PauseId, CallStack | null> = new Map();

export const {
  getValueSuspense: getPauseIdForExecutionPointSuspense,
  getValueAsync: getPauseIdForExecutionPointAsync,
  getValueIfCached: getPauseIdForExecutionPointIfCached,
} = createGenericCache2<ReplayClientInterface, [executionPoint: ExecutionPoint], PauseId>(
  async (client, executionPoint) => {
    const createPauseResult = await client.createPause(executionPoint);
    await client.waitForLoadedSources();
    cachePauseData(
      client,
      createPauseResult.pauseId,
      createPauseResult.data,
      createPauseResult.stack
    );
    return createPauseResult.pauseId;
  },
  executionPoint => executionPoint
);

export const {
  getValueSuspense: evaluateSuspense,
  getValueAsync: evaluateAsync,
  getValueIfCached: getEvaluationResultIfCached,
} = createGenericCache2<
  ReplayClientInterface,
  [pauseId: PauseId, frameId: FrameId | null, expression: string],
  Omit<Result, "data">
>(
  async (client, pauseId, frameId, expression) => {
    const result = await client.evaluateExpression(pauseId, expression, frameId);
    await client.waitForLoadedSources();
    cachePauseData(client, pauseId, result.data);
    return { exception: result.exception, failed: result.failed, returned: result.returned };
  },
  (pauseId, frameId, expression) => `${pauseId}:${frameId}:${expression}`
);

export function getCachedCallStackForPauseId(pauseId: PauseId): CallStack | null {
  return callStacksByPauseId.get(pauseId) || null;
}

export function cachePauseData(
  client: ReplayClientInterface,
  pauseId: PauseId,
  pauseData: PauseData,
  stack?: CallStack
) {
  callStacksByPauseId.set(pauseId, stack || null);

  if (pauseData.objects) {
    preCacheObjects(pauseId, pauseData.objects);
  }
  if (stack) {
    const frames = sortFramesAndUpdateLocations(client, pauseData.frames || [], stack);
    if (frames) {
      cacheFrames(frames, pauseId);
    }
  }
  if (pauseData.scopes) {
    for (const scope of pauseData.scopes) {
      cacheScope(scope, pauseId, scope.scopeId);
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

function updateMappedLocation(client: ReplayClientInterface, mappedLocation: MappedLocation) {
  for (const location of mappedLocation) {
    location.sourceId = client.getCorrespondingSourceIds(location.sourceId)[0];
  }
}
