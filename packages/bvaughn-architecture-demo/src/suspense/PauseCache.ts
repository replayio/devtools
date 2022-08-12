import {
  createPauseResult,
  ExecutionPoint,
  FrameId,
  PauseData,
  PauseId,
  Result,
} from "@replayio/protocol";
import { captureException } from "@sentry/browser";
import { ReplayClientInterface } from "shared/client/types";

import { createWakeable } from "../utils/suspense";
import { preCacheObjects } from "./ObjectPreviews";

import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";

const evaluationResultsMap: Map<ExecutionPoint, Record<Result>> = new Map();
const executionPointToPauseMap: Map<ExecutionPoint, Record<createPauseResult>> = new Map();
const executionPointToPauseIdMap: Map<ExecutionPoint, PauseId> = new Map();
const pauseIdToPauseDataMap: Map<PauseId, Record<PauseData>> = new Map();

export function evaluate(
  client: ReplayClientInterface,
  pauseId: PauseId,
  frameId: FrameId | null,
  expression: string
): Result {
  const key = `${pauseId}:${frameId}:${expression}`;
  let record = evaluationResultsMap.get(key);
  if (record == null) {
    record = {
      status: STATUS_PENDING,
      value: createWakeable<Result>(),
    };

    evaluationResultsMap.set(key, record);

    fetchEvaluationResult(client, pauseId, frameId, expression, record);
  }

  if (record!.status === STATUS_RESOLVED) {
    return record!.value;
  } else {
    throw record!.value;
  }
}

export function getPauseData(client: ReplayClientInterface, pauseId: PauseId) {
  let record = pauseIdToPauseDataMap.get(pauseId);
  if (record == null) {
    record = {
      status: STATUS_PENDING,
      value: createWakeable<PauseData>(),
    };

    pauseIdToPauseDataMap.set(pauseId, record);

    fetchPauseData(client, pauseId, record);
  }

  if (record!.status === STATUS_RESOLVED) {
    return record!.value;
  } else {
    throw record!.value;
  }
}

export function getCachedPauseIdForExecutionPoint(executionPoint: ExecutionPoint): PauseId | null {
  return executionPointToPauseIdMap.get(executionPoint) || null;
}

export function getPauseForExecutionPoint(
  client: ReplayClientInterface,
  executionPoint: ExecutionPoint
): createPauseResult {
  let record = executionPointToPauseMap.get(executionPoint);
  if (record == null) {
    record = {
      status: STATUS_PENDING,
      value: createWakeable<createPauseResult>(),
    };

    executionPointToPauseMap.set(executionPoint, record);

    fetchPauseId(client, executionPoint, record);
  }

  if (record!.status === STATUS_RESOLVED) {
    return record!.value;
  } else {
    throw record!.value;
  }
}

async function fetchEvaluationResult(
  client: ReplayClientInterface,
  pauseId: PauseId,
  frameId: FrameId | null,
  expression: string,
  record: Record<Result>
) {
  const wakeable = record.value as Wakeable<Result>;

  try {
    const result = await client.evaluateExpression(pauseId, expression, frameId);

    // Pre-cache object previews that cam back with new Pause data.
    // This will avoid us having to turn around and request them again when rendering the objects.
    const objects = result.data.objects;
    if (objects) {
      preCacheObjects(pauseId, objects);
    }

    record.status = STATUS_RESOLVED;
    record.value = result;

    wakeable.resolve(record.value);
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
  }
}

async function fetchPauseData(
  client: ReplayClientInterface,
  pauseId: PauseId,
  record: Record<PauseData>
) {
  const wakeable = record.value as Wakeable<PauseData>;

  try {
    const pauseData = await client.getAllFrames(pauseId);

    // Pre-cache object previews that cam back with new Pause data.
    // This will avoid us having to turn around and request them again when rendering the objects.
    if (pauseData.objects) {
      preCacheObjects(pauseId, pauseData.objects);
    }

    record.status = STATUS_RESOLVED;
    record.value = pauseData;

    wakeable.resolve(record.value);
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
  }
}

async function fetchPauseId(
  client: ReplayClientInterface,
  executionPoint: ExecutionPoint,
  record: Record<createPauseResult>
) {
  const wakeable = record.value as Wakeable<createPauseResult>;

  try {
    const pause = await client.createPause(executionPoint);

    // Pre-cache object previews that cam back with new Pause data.
    // This will avoid us having to turn around and request them again when rendering the objects.
    if (pause.data.objects) {
      preCacheObjects(pause.pauseId, pause.data.objects);
    }

    record.status = STATUS_RESOLVED;
    record.value = pause;

    trackExecutionPointPauseIds(executionPoint, pause.pauseId);

    wakeable.resolve(record.value);
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
  }
}

export function trackExecutionPointPauseIds(
  executionPoint: ExecutionPoint,
  newPauseId: PauseId
): void {
  const firstPauseId = executionPointToPauseIdMap.get(executionPoint);
  if (firstPauseId == null) {
    executionPointToPauseIdMap.set(executionPoint, newPauseId);
  } else if (firstPauseId !== newPauseId) {
    const error = new Error(
      `Point (${executionPoint}) has multiple pause ids (${firstPauseId}, ${newPauseId})`
    );

    // TODO Hook this up so that it fails our e2e tests if called.
    captureException(error);

    console.error(error);
  }
}
