import { Object, ObjectId, PauseId } from "@replayio/protocol";

import { ReplayClientInterface } from "../../../shared/client/types";

import { createWakeable } from "../utils/suspense";

import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";

type ObjectMap = Map<ObjectId, Object>;
type RecordMap = Map<ObjectId, Record<Object>>;

type ObjectMaps = {
  // This map contains Objects with no guarantee of preview information.
  // These objects may only specify the non-optional "objectId" and "className" fields.
  //
  // We store this information separately because it is enough for type determination (which renderer to use).
  //
  // https://static.replay.io/protocol/tot/Pause/#type-Object
  objectMap: ObjectMap;

  // These maps contain Records of Objects with preview information.
  // This information is fetched (via Suspense) by calling Pause.getObjectPreview().
  //
  // https://static.replay.io/protocol/tot/Pause/#method-getObjectPreview
  previewRecordMap: RecordMap;
  fullPreviewRecordMap: RecordMap;
};

// Object ids are only unique within the scope of a Pause.
// Object caching must be done per Pause id.
// This will change if "persistentId" becomes standard.
//
// https://static.replay.io/protocol/tot/Debugger/#type-PersistentObjectId
type PauseMap = Map<PauseId, ObjectMaps>;

const pauseMap: PauseMap = new Map();

// For now (until/unless PersistentObjectId ships) ObjectIds are only unique within the scope of a pause.
function getOrCreateObjectWithPreviewMap(pauseId: PauseId): ObjectMaps {
  let maps = pauseMap.get(pauseId);
  if (!maps) {
    maps = {
      objectMap: new Map(),
      previewRecordMap: new Map(),
      fullPreviewRecordMap: new Map(),
    };

    pauseMap.set(pauseId, maps);
  }
  return maps!;
}

// Does not suspend.
// This method is safe to call outside of render.
// The Objects it returns are not guaranteed to contain preview information.
export function getObjectThrows(pauseId: PauseId, objectId: ObjectId): Object {
  const objectMap = getOrCreateObjectWithPreviewMap(pauseId).objectMap;
  const object = objectMap.get(objectId);
  if (!object) {
    throw new ObjectPreviewError(`Could not find object with id "${objectId}"`);
  }
  return object;
}

// Suspends if no Object can be found, or if one is found without a Preview.
// This method should only be called during render.
// The Objects it returns are guaranteed to contain preview information.
export function getObjectWithPreview(
  client: ReplayClientInterface,
  pauseId: PauseId,
  objectId: ObjectId,
  noOverflow: boolean = false
): Object {
  const maps = getOrCreateObjectWithPreviewMap(pauseId);
  const recordMap = noOverflow ? maps.fullPreviewRecordMap : maps.previewRecordMap;

  let record = recordMap.get(objectId);
  if (record == null) {
    const wakeable = createWakeable<Object>();

    record = {
      status: STATUS_PENDING,
      value: wakeable,
    };

    recordMap.set(objectId, record);

    fetchObjectWithPreview(client, pauseId, objectId, record, wakeable, noOverflow);
  }

  if (record!.status === STATUS_RESOLVED) {
    return record!.value;
  } else {
    throw record!.value;
  }
}

export function preCacheObjects(pauseId: PauseId, objects: Object[]): void {
  objects.forEach(object => preCacheObject(pauseId, object));
}

export function preCacheObject(pauseId: PauseId, object: Object): void {
  const { objectMap, previewRecordMap, fullPreviewRecordMap } =
    getOrCreateObjectWithPreviewMap(pauseId);
  const { objectId } = object;

  // Always cache Objects in the objectMap map, even onces without previews or with overflow.
  if (!objectMap.has(objectId)) {
    objectMap.set(objectId, object);
  }

  // Only cache objects with previews in the recordMap map though.
  if (object.preview != null) {
    const record = previewRecordMap.get(objectId);
    if (record == null) {
      previewRecordMap.set(objectId, {
        status: STATUS_RESOLVED,
        value: object,
      });
    } else if (record.status !== STATUS_RESOLVED) {
      // @ts-ignore
      record.status = STATUS_RESOLVED;
      record.value = object;
    }

    if (!object.preview.overflow) {
      const record = fullPreviewRecordMap.get(objectId);
      if (record == null) {
        fullPreviewRecordMap.set(objectId, {
          status: STATUS_RESOLVED,
          value: object,
        });
      } else if (record.status !== STATUS_RESOLVED) {
        // @ts-ignore
        record.status = STATUS_RESOLVED;
        record.value = object;
      }
    }
  }
}

async function fetchObjectWithPreview(
  client: ReplayClientInterface,
  pauseId: PauseId,
  objectId: ObjectId,
  record: Record<Object>,
  wakeable: Wakeable<Object>,
  noOverflow: boolean = false
) {
  try {
    const { objects = [] } = await client.getObjectWithPreview(
      objectId,
      pauseId,
      noOverflow ? "full" : "canOverflow"
    );

    // This response will contain the specific Object we're searching for,
    // but it may contain other nested objects as well.
    // Pre-populate the cache with those objects so that we can avoid re-requesting them.
    preCacheObjects(pauseId, objects);

    // The preCacheObjects() will have updated the Record's status and value already.
    wakeable.resolve(record.value);
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
  }
}

export class ObjectPreviewError extends Error {}