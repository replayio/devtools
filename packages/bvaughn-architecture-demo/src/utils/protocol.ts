import {
  NamedValue as ProtocolNamedValue,
  Object as ProtocolObject,
  ObjectId as ProtocolObjectId,
  PauseId as ProtocolPauseId,
  Property as ProtocolProperty,
  Value as ProtocolValue,
} from "@replayio/protocol";
import { getObjectThrows } from "../suspense/ObjectPreviews";

type ObjectType = "html" | "map" | "other" | "regexp" | "set";

type ValueType =
  | "array"
  | "bigint"
  | "boolean"
  | "function"
  | "nan"
  | "null"
  | "number"
  | "object"
  | "string"
  | "symbol"
  | "undefined";

export type Value = {
  name: string | null;
  objectId?: string;
  preview?: string;
  type: ValueType;
};

export function filterNonEnumerableProperties(properties: ProtocolProperty[]): ProtocolProperty[] {
  // See https://static.replay.io/protocol/tot/Pause/#type-PropertyConfigurationFlags
  return properties.filter(property => property.flags == null || property.flags & 4);
}

export function getObjectType(objectWithPreview: ProtocolObject): ObjectType {
  switch (objectWithPreview.className) {
    case "Map":
    case "WeakMap":
      return "map";
      break;
    case "RegExp":
      return "regexp";
      break;
    case "Set":
    case "WeakSet":
      return "set";
      break;
    default:
      if (
        (objectWithPreview.className.startsWith("HTML") ||
          objectWithPreview.className === "Text") &&
        objectWithPreview.preview?.node != null
      ) {
        return "html";
      } else {
        return "other";
      }
      break;
  }
}

// TODO It would be nice if the protocol's Value objects used a consistent format.
// As it is, these values have conditional fields which require special handling.
// This utility function maps from one ot the other.
//
// See https://linear.app/replay/issue/BAC-1808
export function reformatValue(
  pauseId: ProtocolPauseId,
  protocolValue: ProtocolValue | ProtocolNamedValue
): Value {
  const name = protocolValue.hasOwnProperty("name")
    ? (protocolValue as ProtocolNamedValue).name
    : null;

  // TODO (inspector) Do we need special handling for "uninitialized" or "unavailable" values?

  if (protocolValue.hasOwnProperty("value")) {
    const value = protocolValue.value;
    switch (typeof value) {
      case "boolean":
        return {
          name,
          preview: `${value}`,
          type: "boolean",
        };
      case "number":
        return {
          name,
          preview: `${value}`,
          type: "number",
        };
      case "string":
        return {
          name,
          preview: value,
          type: "string",
        };
      case "object":
        return {
          name,
          preview: "null",
          type: "null",
        };
    }
  } else if (protocolValue.hasOwnProperty("bigint")) {
    return { name, preview: `${protocolValue.bigint}n`, type: "bigint" };
  } else if (protocolValue.hasOwnProperty("unserializableNumber")) {
    if (protocolValue.unserializableNumber === "NaN") {
      return { name, preview: "NaN", type: "nan" };
    } else {
      return { name, preview: `${protocolValue.unserializableNumber}`, type: "number" };
    }
  } else if (protocolValue.hasOwnProperty("symbol")) {
    return { name, preview: `${protocolValue.symbol}`, type: "symbol" };
  } else {
    let objectId: ProtocolObjectId | undefined;
    if (protocolValue.hasOwnProperty("object")) {
      objectId = protocolValue.object;
    } else if (protocolValue.hasOwnProperty("get")) {
      // TODO ProtocolValue doesn't define this field, but the backend returns it.
      // @ts-ignore
      objectId = protocolValue.get as ProtocolObjectId;
    } else if (protocolValue.hasOwnProperty("set")) {
      // TODO ProtocolValue doesn't define this field, but the backend returns it.
      // @ts-ignore
      objectId = protocolValue.set as ProtocolObjectId;
    }

    if (objectId) {
      const object = objectId ? getObjectThrows(pauseId, objectId) : null;
      if (!object) {
        throw Error(`Could not find object with id "${objectId}"`);
      }

      let preview: string | undefined;
      let type: ValueType = "object";
      switch (object.className) {
        case "Array":
          type = "array";
          break;
        case "Function":
          type = "function";
          break;
      }

      return { name, objectId, preview, type };
    }

    // Tricky: Values representing undefined don't have explicit "value" keys
    // You have to detect them by the absence of an explicit "value" key–
    // Meaning they won't have "value", "bigint", "symbol", or "unserializableNumber" keys.
    // This is pretty awkward to work with and I wish the protocol would change.
    const keys = Object.keys(protocolValue);
    if (keys.length === 0 || (keys.length === 1 && keys[0] === "name")) {
      return { name, preview: "undefined", type: "undefined" };
    }
  }

  throw Error(`Unsupported value type`);
}
