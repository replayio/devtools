import {
  NamedValue as ProtocolNamedValue,
  ObjectId as ProtocolObjectId,
  PauseId as ProtocolPauseId,
  Property as ProtocolProperty,
  Value as ProtocolValue,
} from "@replayio/protocol";
import { getObjectThrows } from "../suspense/ObjectPreviews";

type ValueType =
  | "array"
  | "bigint"
  | "boolean"
  | "function"
  | "html-element"
  | "html-text" // Separate type makes it easier for text to be shown inline (e.g. "<div>Some text</div>")
  | "map" // Map or WeakMap
  | "nan"
  | "null"
  | "number"
  | "object" // Fall back for all other types
  | "regexp"
  | "set" // Set or WeakSeat
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

// TODO It would be nice if the protocol's Value objects used a consistent format.
// As it is, these values have conditional fields which require special handling.
// This utility function maps from one ot the other.
//
// See https://linear.app/replay/issue/BAC-1808
export function protocolValueToClientValue(
  pauseId: ProtocolPauseId,
  protocolValue: ProtocolValue | ProtocolNamedValue
): Value {
  const name = protocolValue.hasOwnProperty("name")
    ? (protocolValue as ProtocolNamedValue).name
    : null;

  if (protocolValue.uninitialized || protocolValue.unavailable) {
    return {
      name,
      preview: protocolValue.uninitialized ? "(uninitialized)" : "(unavailable)",
      type: "string",
    };
  }

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

      const className = object.className;

      let preview: string | undefined;
      let type: ValueType = "object";
      switch (className) {
        case "Array":
          type = "array";
          break;
        case "Function":
          type = "function";
          break;
        case "Map":
        case "WeakMap":
          type = "map";
          break;
        case "RegExp":
          type = "regexp";
          break;
        case "Set":
        case "WeakSet":
          type = "set";
          break;
        default:
          if (className.startsWith("HTML")) {
            type = "html-element";
          } else if (className === "Text") {
            type = "html-text";
          }
          break;
      }

      return { name, objectId, preview, type };
    }

    // Tricky: Values representing undefined don't have explicit "value" keys
    // You have to detect them by the absence of an explicit "value" key–
    // Meaning they won't have "value", "bigint", "symbol", or "unserializableNumber" keys.
    // This is pretty awkward to work with and I wish the protocol would change.
    const keys = Object.keys(protocolValue).filter(key => key !== "name" && key !== "flags");
    if (keys.length === 0) {
      return { name, preview: "undefined", type: "undefined" };
    }
  }

  throw Error(`Unsupported value type`);
}

export function clientValueToProtocolNamedValue(clientValue: any): ProtocolNamedValue {
  const protocolValue = clientValueToProtocolValue(clientValue);
  return {
    ...protocolValue,
    name: clientValue.name || "",
  };
}

export function clientValueToProtocolValue(clientValue: any): ProtocolValue {
  const protocolValue: ProtocolValue | ProtocolNamedValue = {};

  if (clientValue.contents.isUnavailable()) {
    protocolValue.unavailable = true;
  } else if (clientValue.contents.isUninitialized()) {
    protocolValue.uninitialized = true;
  } else if (clientValue.contents.isUnserializableNumber()) {
    protocolValue.unserializableNumber = `${clientValue.contents.primitive()}`;
  } else if (clientValue.contents.isSymbol()) {
    protocolValue.symbol = clientValue.contents.primitive() as string;
  } else if (clientValue.contents.isBigInt()) {
    protocolValue.bigint = `${clientValue.contents.primitive()}`;
  } else if (clientValue.isObject()) {
    protocolValue.object = clientValue.contents.objectId();
  } else if (clientValue.isPrimitive()) {
    const primitive = clientValue.contents.primitive();
    if (primitive !== undefined) {
      protocolValue.value = primitive;
    }
  }

  return protocolValue;
}
