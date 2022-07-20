import {
  createPauseResult,
  ExecutionPoint,
  FrameId,
  PauseData,
  PauseId,
  Result,
} from "@replayio/protocol";
import { ReplayClientInterface } from "shared/client/types";

import { createWakeable } from "../utils/suspense";
import { preCacheObjects } from "./ObjectPreviews";

import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";

const evaluationResultsMap: Map<ExecutionPoint, Record<Result>> = new Map();
const executionPointToPauseMap: Map<ExecutionPoint, Record<createPauseResult>> = new Map();
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

    // Pre-cache object previews that came back with our new analysis data.
    // This will avoid us having to turn around and request them again when rendering the logs.
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

    record.status = STATUS_RESOLVED;
    record.value = pause;

    wakeable.resolve(record.value);
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
  }
}
