import {
  NamedValue,
  Object,
  ObjectId,
  ObjectPreviewLevel,
  PauseId,
  Property,
  Value as ProtocolValue,
  SourceId,
} from "@replayio/protocol";
import * as Sentry from "@sentry/react";
import { Cache, createCache } from "suspense";

import { assert } from "protocol/utils";

import { ReplayClientInterface } from "../../../shared/client/types";
import { Value as ClientValue, protocolValueToClientValue } from "../utils/protocol";
import { cachePauseData, updateMappedLocation } from "./PauseCache";
import { Source, sourcesByIdCache } from "./SourcesCache";
import debounce from 'lodash/debounce'

const debouncedGetObjectPreviews = debounce(async (client, pauseId: PauseId, previewLevel: ObjectPreviewLevel) => {
  const objects = pauseObjectCache[pauseId][previewLevel];
  pauseObjectCache[pauseId][previewLevel] = [];
  console.log('fetching objects', objects)
  const data = await client.getObjectsPreviews(objects, pauseId, previewLevel)
  console.log('fetched objects', data)
  const sources = await sourcesByIdCache.readAsync(client);
  cachePauseData(client, sources, pauseId, data);
}, 100)

const getObjectPreview = async (client, objectId, pauseId, previewLevel) => {
  const data = await client.getObjectWithPreview(objectId, pauseId, previewLevel);
  const sources = await sourcesByIdCache.readAsync(client);
  cachePauseData(client, sources, pauseId, data);

}

const pauseObjectCache: Record<PauseId, Record<ObjectPreviewLevel, string[]>> = {}

export const objectCache: Cache<
  [
    client: ReplayClientInterface,
    pauseId: PauseId,
    objectId: ObjectId,
    previewLevel: ObjectPreviewLevel
  ],
  Object
> = createCache({
  config: { immutable: true },
  debugLabel: "objectCache",
  getKey: ([client, pauseId, objectId, previewLevel]) => `${pauseId}:${objectId}:${previewLevel}`,
  load: async ([client, pauseId, objectId, previewLevel]) => {

    if (true) {

      console.log('load object cache', pauseId, objectId)
      await sourcesByIdCache.readAsync(client);

      if (!pauseObjectCache[pauseId]) {
        pauseObjectCache[pauseId] = {}
      }
      if (!pauseObjectCache[pauseId][previewLevel]) {
        pauseObjectCache[pauseId][previewLevel] = []
      }

      pauseObjectCache[pauseId][previewLevel].push(objectId)


      await debouncedGetObjectPreviews(client, pauseId, previewLevel)
    } else {
      await getObjectPreview(client, objectId, pauseId, previewLevel)
    }

    // cachePauseData() calls preCacheObjects()
    // so the object should be in the cache now
    try {
      return objectCache.getValue(client, pauseId, objectId, previewLevel);
    } catch (error) {
      Sentry.captureException(error, { extra: { objectId, previewLevel, data } });
      throw error;
    }
  },
});

export const objectPropertyCache: Cache<
  [client: ReplayClientInterface, pauseId: PauseId, objectId: ObjectId, propertyName: string],
  ProtocolValue | null
> = createCache({
  config: { immutable: true },
  debugLabel: "objectPropertyCache",
  getKey: ([client, pauseId, objectId, propertyName]) => `${pauseId}:${objectId}:${propertyName}`,
  load: async ([client, pauseId, objectId, propertyName]) => {
    const cachedObject = objectCache.getValueIfCached(
      null as any,
      pauseId,
      objectId,
      "canOverflow"
    );
    if (cachedObject) {
      assert(cachedObject.preview);
      const getterValue = cachedObject.preview.getterValues?.find(v => v.name === propertyName);
      if (getterValue) {
        return removeName(getterValue);
      }
      const property = cachedObject.preview.properties?.find(p => p.name === propertyName);
      if (property && !property.get && !property.set) {
        return removeName(property);
      }
    }

    const { data, returned } = await client.getObjectProperty(objectId, pauseId, propertyName);

    const sources = await sourcesByIdCache.readAsync(client);
    cachePauseData(client, sources, pauseId, data);

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

// This method is safe to call outside of render.
// The preview information of Objects it returns may overflow.
export function getCachedObjectWithPreview(pauseId: PauseId, objectId: ObjectId): Object | null {
  // The objectCache only uses the "client" param for fetching values, not caching them
  const nullClient = null as any;
  return (
    objectCache.getValueIfCached(nullClient, pauseId, objectId, "full") ??
    objectCache.getValueIfCached(nullClient, pauseId, objectId, "canOverflow") ??
    null
  );
}

export function preCacheObjects(
  sources: Map<SourceId, Source>,
  pauseId: PauseId,
  objects: Object[]
): void {
  objects.forEach(object => preCacheObject(sources, pauseId, object));
}

export function preCacheObject(
  sources: Map<SourceId, Source>,
  pauseId: PauseId,
  object: Object
): void {
  const { objectId } = object;

  // Always cache basic object data
  objectCache.cache(object, null as any, pauseId, objectId, "none");

  // Only cache objects with previews if they meet the criteria
  if (object.preview != null) {
    objectCache.cache(object, null as any, pauseId, objectId, "canOverflow");

    if (!object.preview.overflow) {
      objectCache.cache(object, null as any, pauseId, objectId, "full");
    }

    if (object.preview.functionLocation) {
      updateMappedLocation(sources, object.preview.functionLocation);
    }
  }
}

function removeName(namedValue: NamedValue): ProtocolValue {
  const { name, ...value } = namedValue;
  return value;
}

export const clientValueCache = createCache<
  [
    client: ReplayClientInterface,
    pauseId: PauseId,
    protocolValue: ProtocolValue | NamedValue | Property
  ],
  ClientValue
>({
  config: { immutable: true },
  debugLabel: "clientValueCache",
  getKey: ([client, pauseId, protocolValue]) => `${pauseId}:${JSON.stringify(protocolValue)}`,
  load: ([client, pauseId, protocolValue]) =>
    protocolValueToClientValue(client, pauseId, protocolValue),
});
