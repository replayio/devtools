import { Value as ProtocolValue } from "@replayio/protocol";

import {
  getObjectThrows,
  getObjectWithPreviewHelper,
} from "bvaughn-architecture-demo/src/suspense/ObjectPreviews";
import { protocolValueToClientValue } from "bvaughn-architecture-demo/src/utils/protocol";
import { ReplayClientInterface } from "shared/client/types";

// like JSON, but including `undefined`
export type JSONishValue =
  | boolean
  | string
  | number
  | null
  | undefined
  | JSONishValue[]
  | { [key: string]: JSONishValue };

/**
 * Takes a backend `objectId`, loads its data preview, and
 * fetches/caches data for all of its fields that are objects/arrays.
 * Note that this does not return the object with its contents - it
 * just makes sure all the fields exist in the cache.
 */
export async function loadObjectProperties(
  replayClient: ReplayClientInterface,
  pauseId: string,
  objectId: string
) {
  const obj = await getObjectWithPreviewHelper(replayClient, pauseId, objectId);

  const properties = obj.preview?.properties ?? [];
  const objectProperties = properties.filter(entry => "object" in entry) ?? [];

  const propertyPromises = objectProperties.map(prop =>
    getObjectWithPreviewHelper(replayClient, pauseId, prop.object!)
  );

  await Promise.all(propertyPromises);
}

/**
 * Takes a backend Replay API `ProtocolValue`, recurses over it,
 * and returns a plain JS object/array/primitive with nested data.
 *
 * Ported from the original `NodeFront.getJSON()` implementation.
 */
export async function getJSON(
  replayClient: ReplayClientInterface,
  pauseId: string,
  value: ProtocolValue,
  visitedObjectIds = new Set<string>()
): Promise<JSONishValue> {
  const clientObject = protocolValueToClientValue(pauseId, value);

  if (clientObject.objectId) {
    if (visitedObjectIds.has(clientObject.objectId!)) {
      return undefined;
    }

    visitedObjectIds = new Set(visitedObjectIds);
    visitedObjectIds.add(clientObject.objectId!);

    await loadObjectProperties(replayClient, pauseId, clientObject.objectId!);
    const obj = getObjectThrows(pauseId, clientObject.objectId!);

    const properties = obj.preview?.properties ?? [];

    const actualPropValues = await Promise.all(
      properties.map(async val => {
        const value = await getJSON(replayClient, pauseId, val, visitedObjectIds);
        const key = val.name;
        return [key, value] as [string, JSONishValue];
      })
    );

    if (clientObject.type === "array") {
      let result: JSONishValue[] = [];
      for (const [key, value] of actualPropValues) {
        const index = parseInt(key);
        if (Number.isInteger(index)) {
          result[index] = value;
        }
      }
      return result;
    }

    return Object.fromEntries(actualPropValues);
  }
  switch (clientObject.type) {
    case "boolean": {
      return clientObject.preview === "true";
    }
    case "string":
    case "symbol": {
      return clientObject.preview!;
    }
    case "number":
    case "nan": {
      return Number(clientObject.preview!);
    }
    case "null": {
      return null;
    }
    case "undefined": {
      return undefined;
    }
  }

  throw new Error("Unexpected client value! " + JSON.stringify(clientObject));
}
