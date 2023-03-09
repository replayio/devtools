import { Object, ObjectId, PauseId, Value as ProtocolValue } from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { ReplayClientInterface } from "../../../shared/client/types";
import { cachePauseData } from "./PauseCache";

export const objectCache: Cache<
  [
    client: ReplayClientInterface,
    pauseId: PauseId,
    objectId: ObjectId,
    hasPreview?: boolean,
    noOverflow?: boolean
  ],
  Object
> = createCache({
  // The protocol only sends objects once per session;
  // disable weak ref caching to ensure we don't lose data
  config: { useWeakRef: false },
  debugLabel: "objectCache",
  getKey: (client, pauseId, objectId, hasPreview = false, noOverflow = false) =>
    `${pauseId}:${objectId}:${hasPreview}:${noOverflow}`,
  load: async (client, pauseId, objectId, hasPreview = false, noOverflow = false) => {
    const data = await client.getObjectWithPreview(
      objectId,
      pauseId,
      noOverflow ? "full" : "canOverflow"
    );

    cachePauseData(client, pauseId, data);

    // cachePauseData() calls preCacheObjects()
    // so the object should be in the cache now
    return objectCache.getValue(client, pauseId, objectId, hasPreview, noOverflow);
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
  getKey: (client, pauseId, objectId, propertyName) => `${pauseId}:${objectId}:${propertyName}`,
  load: async (client, pauseId, objectId, propertyName) => {
    const { data, returned } = await client.getObjectProperty(objectId, pauseId, propertyName);

    cachePauseData(client, pauseId, data);

    return returned ?? null;
  },
});

export function preCacheObjects(pauseId: PauseId, objects: Object[]): void {
  objects.forEach(object => preCacheObject(pauseId, object));
}

export function preCacheObject(pauseId: PauseId, object: Object): void {
  const { objectId } = object;

  // Always cache basic object data
  objectCache.cache(object, null as any, pauseId, objectId, false, false);

  // Only cache objects with previews if they meet the criteria
  if (object.preview != null) {
    objectCache.cache(object, null as any, pauseId, objectId, true, false);

    if (!object.preview.overflow) {
      objectCache.cache(object, null as any, pauseId, objectId, true, true);
    }
  }
}
