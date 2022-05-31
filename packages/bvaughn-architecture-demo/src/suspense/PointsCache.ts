import { ExecutionPoint, SessionId } from "@replayio/protocol";
import { unstable_getCacheForType as getCacheForType } from "react";
import { ReplayClientInterface } from "../ReplayClient";

import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "../types";
import { createWakeable } from "../utils/suspense";

// TODO We could add some way for external code (in the client adapter) to pre-populate this cache with known points.
// For example, when we get Paints they have a corresponding point (and time) which could be pre-loaded here.

type TimeToRecordMap = Map<number, Record<ExecutionPoint>>;

function createMap(): TimeToRecordMap {
  return new Map();
}

function getRecordMap(): TimeToRecordMap {
  return getCacheForType(createMap);
}

export function getClosestPointForTime(
  client: ReplayClientInterface,
  time: number
): ExecutionPoint {
  const map = getRecordMap();
  let record = map.get(time);
  if (record == null) {
    const wakeable = createWakeable();

    record = {
      status: STATUS_PENDING,
      value: wakeable,
    };

    map.set(time, record);

    fetchPoint(client, time, record, wakeable);
  }

  if (record.status === STATUS_RESOLVED) {
    return record.value;
  } else {
    throw record.value;
  }
}

async function fetchPoint(
  client: ReplayClientInterface,
  time: number,
  record: Record<ExecutionPoint>,
  wakeable: Wakeable
) {
  try {
    const point = await client.getPointNearTime(time);

    record.status = STATUS_RESOLVED;
    record.value = point.point;

    wakeable.resolve();
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
  }
}
