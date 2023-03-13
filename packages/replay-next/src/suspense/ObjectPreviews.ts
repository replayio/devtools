import {
  Object,
  ObjectId,
  ObjectPreviewLevel,
  PauseId,
  Value as ProtocolValue,
} from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { ReplayClientInterface } from "../../../shared/client/types";
import { cachePauseData } from "./PauseCache";

export const objectCache: Cache<
  [
    client: ReplayClientInterface,
    pauseId: PauseId,
    objectId: ObjectId,
    previewLevel: ObjectPreviewLevel
  ],
  Object
> = createCache({
  // The protocol only sends objects once per session;
  // disable weak ref caching to ensure we don't lose data
  config: { useWeakRef: false },
  debugLabel: "objectCache",
  getKey: ([client, pauseId, objectId, previewLevel]) => `${pauseId}:${objectId}:${previewLevel}`,
  load: async ([client, pauseId, objectId, previewLevel]) => {
    const data = await client.getObjectWithPreview(objectId, pauseId, previewLevel);

    cachePauseData(client, pauseId, data);

    // cachePauseData() calls preCacheObjects()
    // so the object should be in the cache now
    return objectCache.getValue(client, pauseId, objectId, previewLevel);
  },
});

export const objectPropertyCache: Cache<
  [client: ReplayClientInterface, pauseId: PauseId, objectId: ObjectId, propertyName: string],
  ProtocolValue | null
> = createCache({
  // The protocol only sends objects once per session;
  // disable weak ref caching to ensure we don't lose data
  config: { useWeakRef: false },
  debugLabel: "objectPropertyCache",
  getKey: ([client, pauseId, objectId, propertyName]) => `${pauseId}:${objectId}:${propertyName}`,
  load: async ([client, pauseId, objectId, propertyName]) => {
    const { data, returned } = await client.getObjectProperty(objectId, pauseId, propertyName);

    cachePauseData(client, pauseId, data);

    return returned ?? null;
  },
});

// This method is safe to call outside of render.
// The Objects it returns are not guaranteed to contain preview information.
export function getCachedObject(pauseId: PauseId, objectId: ObjectId): Object | null {
  // The objectCache only uses the "client" param for fetching values, not caching them
  const nullClient = null as any;
  return (
    objectCache.getValueIfCached(nullClient, pauseId, objectId, "full") ??
    objectCache.getValueIfCached(nullClient, pauseId, objectId, "canOverflow") ??
    objectCache.getValueIfCached(nullClient, pauseId, objectId, "none") ??
    null
  );
}

export function preCacheObjects(pauseId: PauseId, objects: Object[]): void {
  objects.forEach(object => preCacheObject(pauseId, object));
}

export function preCacheObject(pauseId: PauseId, object: Object): void {
  const { objectId } = object;

  // Always cache basic object data
  objectCache.cache(object, null as any, pauseId, objectId, "none");

  // Only cache objects with previews if they meet the criteria
  if (object.preview != null) {
    objectCache.cache(object, null as any, pauseId, objectId, "canOverflow");

    if (!object.preview.overflow) {
      objectCache.cache(object, null as any, pauseId, objectId, "full");
    }
  }
}
