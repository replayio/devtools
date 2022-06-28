import { PauseData, PauseId } from "@replayio/protocol";
import { ReplayClientInterface } from "shared/client/types";

import { createWakeable } from "../utils/suspense";

import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";

const pauseIdToRecordMap: Map<PauseId, Record<PauseData>> = new Map();

export function getPauseData(client: ReplayClientInterface, pauseId: PauseId) {
  let record = pauseIdToRecordMap.get(pauseId);
  if (record == null) {
    record = {
      status: STATUS_PENDING,
      value: createWakeable<PauseData>(),
    };

    pauseIdToRecordMap.set(pauseId, record);

    fetchPauseData(client, pauseId, record, record.value);
  }

  if (record!.status === STATUS_RESOLVED) {
    return record!.value;
  } else {
    throw record!.value;
  }
}

async function fetchPauseData(
  client: ReplayClientInterface,
  pauseId: PauseId,
  record: Record<PauseData>,
  wakeable: Wakeable<PauseData>
) {
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
