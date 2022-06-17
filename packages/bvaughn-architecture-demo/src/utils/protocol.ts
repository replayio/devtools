import {
  NamedValue as ProtocolNamedValue,
  ObjectId as ProtocolObjectId,
  PauseId,
  Value as ProtocolValue,
} from "@replayio/protocol";
import { getObjectThrows } from "../suspense/ObjectPreviews";

type ValueType =
  | "array"
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

// TODO It would be nice if the protocol's Value objects used a consistent format.
// As it is, these values have conditional fields which require special handling.
// This utility function maps from one ot the other.
export function reformatValue(
  pauseId: PauseId,
  protocolValue: ProtocolValue | ProtocolNamedValue
): Value {
  const name = protocolValue.hasOwnProperty("name")
    ? (protocolValue as ProtocolNamedValue).name
    : null;

  // TODO Do we need special handling for "uninitialized" or "unavailable" values?

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
    return { name, preview: `${protocolValue.bigint}n`, type: "number" };
  } else if (protocolValue.hasOwnProperty("unserializableNumber")) {
    if (protocolValue.unserializableNumber === "NaN") {
      return { name, preview: "NaN", type: "nan" };
    } else {
      return { name, preview: `${protocolValue.unserializableNumber}`, type: "number" };
    }
  } else if (protocolValue.hasOwnProperty("symbol")) {
    return { name, preview: `${protocolValue.symbol}`, type: "symbol" };
  } else if (Object.keys(protocolValue).length === 0) {
    return { name, preview: "undefined", type: "undefined" };
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

  throw Error(`Unsupported value type`);
}
