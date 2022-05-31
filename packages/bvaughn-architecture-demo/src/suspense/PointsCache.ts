import { ExecutionPoint, SessionId } from "@replayio/protocol";
import { client } from "protocol/socket";
import { unstable_getCacheForType as getCacheForType } from "react";

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

export function getClosestPointForTime(time: number, sessionId: SessionId): ExecutionPoint {
  const map = getRecordMap();
  let record = map.get(time);
  if (record == null) {
    const wakeable = createWakeable();

    record = {
      status: STATUS_PENDING,
      value: wakeable,
    };

    map.set(time, record);

    fetchPoint(time, sessionId, record, wakeable);
  }

  if (record.status === STATUS_RESOLVED) {
    return record.value;
  } else {
    throw record.value;
  }
}

async function fetchPoint(
  time: number,
  sessionId: SessionId,
  record: Record<ExecutionPoint>,
  wakeable: Wakeable
) {
  try {
    // TODO Replace these client references with ReplayClient instance.
    const timeStampedPoint = await client.Session.getPointNearTime({ time: time }, sessionId);

    record.status = STATUS_RESOLVED;
    record.value = timeStampedPoint.point.point;

    wakeable.resolve();
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
  }
}
