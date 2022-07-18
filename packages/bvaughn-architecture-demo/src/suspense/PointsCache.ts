import {
  ExecutionPoint,
  Location,
  TimeStampedPoint,
  TimeStampedPointRange,
} from "@replayio/protocol";
import { ReplayClientInterface } from "shared/client/types";

import { createWakeable } from "../utils/suspense";

import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";

// TODO We could add some way for external code (in the client adapter) to pre-populate this cache with known points.
// For example, when we get Paints they have a corresponding point (and time) which could be pre-loaded here.

const focusRangeToLogPointsMap: Map<string, TimeStampedPoint[]> = new Map();
const locationToHitPointsMap: Map<string, Record<TimeStampedPoint[]>> = new Map();
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

export function getHitPointsForLocation(
  client: ReplayClientInterface,
  location: Location,
  focusRange: TimeStampedPointRange | null
): TimeStampedPoint[] {
  const key = `${location.sourceId}:${location.line}:${location.column}`;
  let record = locationToHitPointsMap.get(key);
  if (record == null) {
    const wakeable = createWakeable<TimeStampedPoint[]>();

    record = {
      status: STATUS_PENDING,
      value: wakeable,
    };

    locationToHitPointsMap.set(key, record);

    fetchHitPointsForLocation(client, location, record, wakeable);
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

    wakeable.resolve(point);
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
  }
}

async function fetchHitPointsForLocation(
  client: ReplayClientInterface,
  location: Location,
  record: Record<TimeStampedPoint[]>,
  wakeable: Wakeable<TimeStampedPoint[]>
) {
  try {
    const executionPoints = await client.getHitPointsForLocation(location);

    record.status = STATUS_RESOLVED;
    record.value = executionPoints;

    wakeable.resolve(executionPoints);
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
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
    const key = `${location.sourceId}:${location.line}:${location.column}:${focusRange.begin.time}:${focusRange.end.time}`;
    if (!focusRangeToLogPointsMap.has(key)) {
      const focusBeginTime = focusRange!.begin!.time;
      const focusEndTime = focusRange!.end!.time;

      focusRangeToLogPointsMap.set(
        key,
        logPoints.filter(
          logPoint => logPoint.time >= focusBeginTime && logPoint.time <= focusEndTime
        )
      );
    }

    return focusRangeToLogPointsMap.get(key)!;
  }
}
