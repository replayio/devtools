import {
  ExecutionPoint,
  Location,
  getPointsBoundingTimeResult as PointsBoundingTime,
  TimeStampedPoint,
  TimeStampedPointRange,
} from "@replayio/protocol";

import { HitPointsAndStatusTuple, ReplayClientInterface } from "shared/client/types";
import { ProtocolError, isCommandError } from "shared/utils/error";

import { createWakeable } from "../utils/suspense";
import { isExecutionPointsLessThan } from "../utils/time";
import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";

export type CachedPointsForTime = Map<number, ExecutionPoint>;
type ChangeHandler = (timeStampedPoint: TimeStampedPoint) => void;

const cachedPointsForTime: CachedPointsForTime = new Map();
const cachedPointsForTimeChangeHandlers: Set<ChangeHandler> = new Set();
const locationToHitPointsMap: Map<string, Record<HitPointsAndStatusTuple>> = new Map();
const sortedExecutionPoints: TimeStampedPoint[] = [];
const sortedPointsBoundingTimes: PointsBoundingTime[] = [];
const timeToInFlightRequestMap: Map<number, Wakeable<ExecutionPoint>> = new Map();
const timeToErrorMap: Map<number, any> = new Map();

export function addCachedPointsForTimeListener(handler: ChangeHandler): () => void {
  cachedPointsForTimeChangeHandlers.add(handler);

  cachedPointsForTime.forEach((point, time) => {
    try {
      handler({ point, time });
    } catch (error) {
      console.error(error);
    }
  });

  return function unsubscribe() {
    cachedPointsForTimeChangeHandlers.delete(handler);
  };
}

function callCachedPointsForTimeListeners(time: number, point: ExecutionPoint): void {
  cachedPointsForTimeChangeHandlers.forEach(handler => {
    try {
      handler({ point, time });
    } catch (error) {
      console.error(error);
    }
  });
}

async function fetchPointsBoundingTime(
  client: ReplayClientInterface,
  time: number,
  wakeable: Wakeable<ExecutionPoint>,
  rethrowError: boolean
) {
  try {
    const pointsBoundingTime = await client.getPointsBoundingTime(time);
    const point = getClosestPointInPointsBoundingTime(time, pointsBoundingTime);

    // Pre-cache time-to-point match and insert into sorted ExecutionPoints array.
    preCacheExecutionPointForTime({ point, time });

    // Also insert bounding points into sorted array; ignore duplicates!
    if (sortedPointsBoundingTimes.length === 0) {
      sortedPointsBoundingTimes.push(pointsBoundingTime);
    } else {
      const beforePoint = pointsBoundingTime.before.point;
      const afterPoint = pointsBoundingTime.after.point;

      let indexBegin = 0;
      let indexEnd = sortedPointsBoundingTimes.length - 1;
      let indexMiddle = 0;

      while (indexBegin <= indexEnd) {
        indexMiddle = Math.floor((indexBegin + indexEnd) / 2);

        const currentPointsBoundingTime = sortedPointsBoundingTimes[indexMiddle];

        if (
          currentPointsBoundingTime.before.point === beforePoint &&
          currentPointsBoundingTime.after.point === afterPoint
        ) {
          // Session.getPointsBoundingTime should never return overlapping ranges that are not exact matches.
          // And we can skip adding add duplicate ranges.
          // These shouldn't be common, but if two times within the same range are requested in parallel, we might see this.
          indexMiddle = -1;
          break;
        } else if (currentPointsBoundingTime.after.point < beforePoint) {
          indexBegin = indexMiddle + 1;
        } else {
          indexEnd = indexMiddle - 1;
        }
      }

      if (indexMiddle >= 0) {
        const closestPointsBoundingTime = sortedPointsBoundingTimes[indexMiddle];
        if (pointsBoundingTime.before.point < closestPointsBoundingTime.after.point) {
          sortedPointsBoundingTimes.splice(indexMiddle, 0, pointsBoundingTime);
        } else {
          sortedPointsBoundingTimes.splice(indexMiddle + 1, 0, pointsBoundingTime);
        }
      }
    }

    wakeable.resolve(point);
  } catch (error) {
    if (rethrowError) {
      throw error;
    } else {
      // Note that we might be caching unloaded region errors by doing this.
      // That's better than flooding the backend with repeated requests,
      // but we also probably don't want to permanently cache this type of error.
      //
      // That being said, the app shouldn't ask for information about a time/point outside of a loaded region.
      // If this became a problem, we could require loaded regions and make them part of the cache key when checking for errors.
      timeToErrorMap.set(time, error);
    }

    wakeable.reject(error);
  } finally {
    timeToInFlightRequestMap.delete(time);
  }
}

async function fetchHitPointsForLocation(
  client: ReplayClientInterface,
  focusRange: TimeStampedPointRange | null,
  location: Location,
  condition: string | null,
  record: Record<HitPointsAndStatusTuple>,
  wakeable: Wakeable<HitPointsAndStatusTuple>
) {
  try {
    const [executionPoints, status] = await client.getHitPointsForLocation(
      focusRange,
      location,
      condition
    );

    record.status = STATUS_RESOLVED;
    record.value = [executionPoints, status];

    wakeable.resolve(record.value);
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
  }
}

function findCachePointsForTime(time: number): ExecutionPoint | null {
  let indexBegin = 0;
  let indexEnd = sortedPointsBoundingTimes.length - 1;

  while (indexBegin <= indexEnd) {
    let indexMiddle = Math.floor((indexBegin + indexEnd) / 2);
    const pointsBoundingTime = sortedPointsBoundingTimes[indexMiddle];

    if (pointsBoundingTime.after.time < time) {
      indexBegin = indexMiddle + 1;
    } else if (pointsBoundingTime.before.time > time) {
      indexEnd = indexMiddle - 1;
    } else {
      return getClosestPointInPointsBoundingTime(time, pointsBoundingTime);
    }
  }

  return null;
}

function findNearestCachedSortedExecutionPointIndex(time: number): number {
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

export function getCachedHitPoints(): Map<number, ExecutionPoint> {
  return cachedPointsForTime;
}

// Does not suspend.
// This method is safe to call outside of render.
// It returns a cached object property if one has been previously loaded, or null.
export function getCachedHitPointsForLocation(
  location: Location,
  condition: string | null,
  focusRange: TimeStampedPointRange | null
): HitPointsAndStatusTuple | null {
  const key = getKey(location, condition, focusRange);
  const record = locationToHitPointsMap.get(key);
  if (record?.status === STATUS_RESOLVED) {
    return record.value;
  }

  return null;
}

export function getClosestPointForTimeSuspense(
  client: ReplayClientInterface,
  time: number
): ExecutionPoint {
  // If we have already fetched a point range that contains this time, we don't need to re-ask.
  const cachedPoint = cachedPointsForTime.get(time);
  if (cachedPoint != null) {
    return cachedPoint;
  } else {
    const executionPoint = findCachePointsForTime(time);
    if (executionPoint !== null) {
      cachedPointsForTime.set(time, executionPoint);
      callCachedPointsForTimeListeners(time, executionPoint);

      return executionPoint;
    }
  }

  // If this request has failed before, don't get caught in a loop of re-asking.
  const error = timeToErrorMap.get(time);
  if (error != null) {
    throw error;
  }

  // Otherwise let's fetch the closest points for this time.
  let wakeable = timeToInFlightRequestMap.get(time);
  if (wakeable == null) {
    wakeable = createWakeable<ExecutionPoint>();

    timeToInFlightRequestMap.set(time, wakeable);

    // Fire and forget for the purposes of Suspense.
    fetchPointsBoundingTime(client, time, wakeable, false);
  }

  throw wakeable;
}

function getClosestPointInPointsBoundingTime(
  time: number,
  pointsBoundingTime: PointsBoundingTime
): ExecutionPoint {
  return Math.abs(pointsBoundingTime.before.time - time) <
    Math.abs(pointsBoundingTime.after.time - time)
    ? pointsBoundingTime.before.point
    : pointsBoundingTime.after.point;
}

export function getHitPointsForLocationSuspense(
  client: ReplayClientInterface,
  location: Location,
  condition: string | null,
  focusRange: TimeStampedPointRange | null
): HitPointsAndStatusTuple {
  // TODO We could add an optimization here to avoid re-fetching if we ever fetched all points (no focus range)
  // without any overflow, and then later fetch for a focus range. Right now we re-fetch in this case.

  const key = getKey(location, condition, focusRange);
  let record = locationToHitPointsMap.get(key);
  if (record == null) {
    const wakeable = createWakeable<HitPointsAndStatusTuple>();

    record = {
      status: STATUS_PENDING,
      value: wakeable,
    };

    locationToHitPointsMap.set(key, record);

    // Fire and forget for the purposes of Suspense.
    fetchHitPointsForLocation(client, focusRange, location, condition, record, wakeable);
  }

  if (record.status === STATUS_RESOLVED) {
    return record.value;
  } else {
    throw record.value;
  }
}

function getKey(
  location: Location,
  condition: string | null,
  focusRange: TimeStampedPointRange | null
): string {
  const locationKey = `${location.sourceId}:${location.line}:${location.column}:${condition}`;
  return focusRange
    ? `${locationKey}:${focusRange.begin.point}:${focusRange.end.point}`
    : locationKey;
}

// Note that this method does not work with Suspense.
// Use getClosestPointForTime() instead.
export async function imperativelyGetClosestPointForTime(
  client: ReplayClientInterface,
  time: number
): Promise<ExecutionPoint> {
  // If we have already fetched a point range that contains this time, we don't need to re-ask.
  const cachedPoint = cachedPointsForTime.get(time);
  if (cachedPoint != null) {
    return cachedPoint;
  } else {
    const executionPoint = findCachePointsForTime(time);
    if (executionPoint !== null) {
      cachedPointsForTime.set(time, executionPoint);
      callCachedPointsForTimeListeners(time, executionPoint);

      return executionPoint;
    }
  }

  // Next try asking the backend for a match and cache it.
  // Note that the backend may throw an error if this time isn't within a loaded region.
  try {
    await fetchPointsBoundingTime(client, time, createWakeable<ExecutionPoint>(), true);
    return cachedPointsForTime.get(time)!;
  } catch (error) {
    if (!isCommandError(error, ProtocolError.RecordingUnloaded)) {
      throw error;
    }
  }

  // If we can't query the backend, fallback to the in-memory cache.
  const index = findNearestCachedSortedExecutionPointIndex(time);
  if (index >= 0) {
    return sortedExecutionPoints[index].point;
  }

  // If our in-memory cache is empty it probably means we haven't yet loaded any regions,
  // in which case the best we can do is fall back to point "0".
  return "0";
}

export function preCacheExecutionPointForTime(timeStampedPoint: TimeStampedPoint): void {
  const { point, time } = timeStampedPoint;

  cachedPointsForTime.set(time, point);
  callCachedPointsForTimeListeners(time, point);

  if (sortedExecutionPoints.length === 0) {
    sortedExecutionPoints.push(timeStampedPoint);
  } else {
    const index = findNearestCachedSortedExecutionPointIndex(time);
    const nearest = sortedExecutionPoints[index];

    if (isExecutionPointsLessThan(point, nearest.point)) {
      sortedExecutionPoints.splice(index, 0, timeStampedPoint);
    } else {
      sortedExecutionPoints.splice(index + 1, 0, timeStampedPoint);
    }
  }
}
