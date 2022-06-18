import { Object, ObjectId, PauseId } from "@replayio/protocol";
import { ReplayClientInterface } from "../client/ReplayClient";

import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";
import { createWakeable } from "../utils/suspense";

type ObjectMap = Map<ObjectId, Record<Object>>;
type PauseMap = Map<PauseId, ObjectMap>;

const pauseMap: PauseMap = new Map();

// For now (until/unless PersistentObjectId ships) ObjectIds are only unique within the scope of a pause.
function getOrCreateObjectWithPreviewMap(pauseId: PauseId): ObjectMap {
  let objectIdMap = pauseMap.get(pauseId);
  if (!objectIdMap) {
    objectIdMap = new Map();

    pauseMap.set(pauseId, objectIdMap);
  }
  return objectIdMap!;
}

// Does not suspend.
// This method is safe to call outside of render.
export function getObjectThrows(pauseId: PauseId, objectId: ObjectId): Object {
  const objectIdMap = getOrCreateObjectWithPreviewMap(pauseId);
  const record = objectIdMap.get(objectId);
  if (!record || record.status !== STATUS_RESOLVED) {
    throw Error(`Could not find object with id "${objectId}"`);
  }
  return record.value;
}

// Suspends if no Object can be found, or if one is found without a Preview.
// This method should only be called during render.
export function getObjectWithPreview(
  client: ReplayClientInterface,
  pauseId: PauseId,
  objectId: ObjectId,
  noOverflow: boolean = false
): Object {
  const objectIdMap = getOrCreateObjectWithPreviewMap(pauseId);

  let record = objectIdMap.get(objectId);

  let shouldFetch = record == null;
  if (noOverflow && record != null && record.status === STATUS_RESOLVED) {
    if (record.value.preview == null) {
      // No preview; this is just an Object.
      shouldFetch = true;
    } else if (record.value.preview.overflow) {
      // Partial preview; not useful for rendering property lists.
      shouldFetch = true;
    }
  }

  if (shouldFetch) {
    const wakeable = createWakeable<Object>();

    if (record != null) {
      record.status = STATUS_PENDING;
      record.value = wakeable;
    } else {
      record = {
        status: STATUS_PENDING,
        value: wakeable,
      };
    }

    objectIdMap.set(objectId, record);

    fetchObjectWithPreview(client, pauseId, objectId, record, wakeable, objectIdMap);
  }

  if (record!.status === STATUS_RESOLVED) {
    return record!.value;
  } else {
    throw record!.value;
  }
}

export function preCacheObjects(pauseId: PauseId, objects: Object[]): void {
  const objectIdMap = getOrCreateObjectWithPreviewMap(pauseId);
  objects.forEach(object => {
    objectIdMap.set(object.objectId, {
      status: STATUS_RESOLVED,
      value: object,
    });
  });
}

async function fetchObjectWithPreview(
  client: ReplayClientInterface,
  pauseId: PauseId,
  objectId: ObjectId,
  record: Record<Object>,
  wakeable: Wakeable<Object>,
  objectIdMap: ObjectMap
) {
  try {
    const { objects = [] } = await client.getObjectWithPreview(objectId, pauseId);

    // This response will contain the specific Object we're searching for,
    // but it may contain other nested objects as well.
    // Pre-populate the cache with those objects so that we can avoid re-requesting them.
    preCacheObjects(pauseId, objects);

    const record = objectIdMap.get(objectId);
    if (record == null) {
      throw new Error(`Could not find object preview for objectId "${objectId}"`);
    }

    wakeable.resolve(record.value);
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
  }
}
