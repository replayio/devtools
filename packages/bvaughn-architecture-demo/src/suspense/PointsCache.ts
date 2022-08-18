import {
  ExecutionPoint,
  Location,
  TimeStampedPoint,
  TimeStampedPointRange,
} from "@replayio/protocol";
import { ReplayClientInterface } from "shared/client/types";
import { isUnloadedRegionError } from "shared/utils/error";

import { createWakeable } from "../utils/suspense";
import { isExecutionPointsLessThan, isExecutionPointsWithinRange } from "../utils/time";

import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";

const focusRangeToLogPointsMap: Map<string, TimeStampedPoint[]> = new Map();
const locationToHitPointsMap: Map<string, Record<TimeStampedPoint[]>> = new Map();
const sortedExecutionPoints: TimeStampedPoint[] = [];
const timeToExecutionPointMap: Map<number, Record<ExecutionPoint>> = new Map();

export function getClosestPointForTime(
  client: ReplayClientInterface,
  time: number
): ExecutionPoint {
  let record = timeToExecutionPointMap.get(time);
  if (record == null) {
    const wakeable = createWakeable<ExecutionPoint>();

    record = {
      status: STATUS_PENDING,
      value: wakeable,
    };

    timeToExecutionPointMap.set(time, record);

    fetchClosestPointForTime(client, time, record, wakeable);
  }

  if (record.status === STATUS_RESOLVED) {
    return record.value;
  } else {
    throw record.value;
  }
}

function getFilteredLogPoints(
  location: Location,
  logPoints: TimeStampedPoint[],
  focusRange: TimeStampedPointRange | null
): TimeStampedPoint[] {
  if (focusRange == null) {
    return logPoints;
  } else {
    const key = `${location.sourceId}:${location.line}:${location.column}:${focusRange.begin}:${focusRange.end}`;
    if (!focusRangeToLogPointsMap.has(key)) {
      const focusBeginPoint = focusRange!.begin.point;
      const focusEndPoint = focusRange!.end.point;

      focusRangeToLogPointsMap.set(
        key,
        logPoints.filter(logPoint =>
          isExecutionPointsWithinRange(logPoint.point, focusBeginPoint, focusEndPoint)
        )
      );
    }

    return focusRangeToLogPointsMap.get(key)!;
  }
}

export function getHitPointsForLocation(
  client: ReplayClientInterface,
  location: Location,
  condition: string | null,
  focusRange: TimeStampedPointRange | null
): TimeStampedPoint[] {
  const key = `${location.sourceId}:${location.line}:${location.column}:${condition}`;
  let record = locationToHitPointsMap.get(key);
  if (record == null) {
    const wakeable = createWakeable<TimeStampedPoint[]>();

    record = {
      status: STATUS_PENDING,
      value: wakeable,
    };

    locationToHitPointsMap.set(key, record);

    fetchHitPointsForLocation(client, focusRange, location, condition, record, wakeable);
  }

  if (record.status === STATUS_RESOLVED) {
    return getFilteredLogPoints(location, record.value, focusRange);
  } else {
    throw record.value;
  }
}

async function fetchClosestPointForTime(
  client: ReplayClientInterface,
  time: number,
  record: Record<ExecutionPoint>,
  wakeable: Wakeable<ExecutionPoint>
) {
  try {
    const { point } = await client.getPointNearTime(time);

    record.status = STATUS_RESOLVED;
    record.value = point;

    preCacheExecutionPointForTime({ point, time });

    wakeable.resolve(point);
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
  }
}

async function fetchHitPointsForLocation(
  client: ReplayClientInterface,
  focusRange: TimeStampedPointRange | null,
  location: Location,
  condition: string | null,
  record: Record<TimeStampedPoint[]>,
  wakeable: Wakeable<TimeStampedPoint[]>
) {
  try {
    const executionPoints = await client.getHitPointsForLocation(focusRange, location, condition);

    record.status = STATUS_RESOLVED;
    record.value = executionPoints;

    wakeable.resolve(executionPoints);
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
  }
}

// Note that this method does not work with Suspense.
// Use getClosestPointForTime() instead.
export async function imperativelyGetClosestPointForTime(
  client: ReplayClientInterface,
  time: number
): Promise<ExecutionPoint> {
  // If we already have a match for this time, use it.
  const record = timeToExecutionPointMap.get(time);
  if (record?.status === STATUS_RESOLVED) {
    return record.value;
  }

  // Next try asking the backend for a match and cache it.
  // Note that the backend may throw an error if this time isn't within a loaded region.
  try {
    const { point } = await client.getPointNearTime(time);

    preCacheExecutionPointForTime({ point, time });

    return point;
  } catch (error) {
    if (!isUnloadedRegionError(error)) {
      throw error;
    }
  }

  // If we can't query the backend, fallback to the in-memory cache.
  const index = getNearestCachedIndex(time);
  if (index >= 0) {
    return sortedExecutionPoints[index].point;
  }

  // If our in-memory cache is empty it probably means we haven't yet loaded any regions,
  // in which case the best we can do is fall back to point "0".
  return "0";
}

function getNearestCachedIndex(time: number): number {
  if (sortedExecutionPoints.length === 0) {
    return -1;
  }

  let indexBegin = 0;
  let indexEnd = sortedExecutionPoints.length - 1;

  while (indexBegin <= indexEnd) {
    let indexMiddle = Math.floor((indexBegin + indexEnd) / 2);
    const currentTime = sortedExecutionPoints[indexMiddle].time;

    if (time === currentTime) {
      // If we find an exact match, bail early.
      return indexMiddle;
    } else if (time < currentTime) {
      indexEnd = indexMiddle - 1;
    } else {
      indexBegin = indexMiddle + 1;
    }
  }

  // If we don't find an exact match, return the closest time.
  const begin = sortedExecutionPoints[indexBegin];
  const end = sortedExecutionPoints[indexEnd];
  if (!begin) {
    return indexEnd;
  } else if (!end) {
    return indexBegin;
  } else {
    return Math.abs(time - begin.time) < Math.abs(time - end.time) ? indexBegin : indexEnd;
  }
}

export function preCacheExecutionPointForTime(timeStampedPoint: TimeStampedPoint): void {
  const { point, time } = timeStampedPoint;

  if (sortedExecutionPoints.length === 0) {
    sortedExecutionPoints.push(timeStampedPoint);
  } else {
    const index = getNearestCachedIndex(time);
    const nearest = sortedExecutionPoints[index];

    if (isExecutionPointsLessThan(point, nearest.point)) {
      sortedExecutionPoints.splice(index, 0, timeStampedPoint);
    } else {
      sortedExecutionPoints.splice(index + 1, 0, timeStampedPoint);
    }
  }

  // Also pre-cache for Suspense.
  if (!timeToExecutionPointMap.has(time)) {
    timeToExecutionPointMap.set(time, { status: STATUS_RESOLVED, value: point });
  }
}
