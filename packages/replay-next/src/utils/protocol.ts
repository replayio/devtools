import {
  NamedValue,
  NamedValue as ProtocolNamedValue,
  Object as ProtocolObject,
  ObjectId as ProtocolObjectId,
  PauseId as ProtocolPauseId,
  Property as ProtocolProperty,
  Value as ProtocolValue,
} from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";

import { objectCache } from "../suspense/ObjectPreviews";
import { Source } from "../suspense/SourcesCache";

type ValueType =
  | "array"
  | "bigint"
  | "boolean"
  | "date"
  | "error"
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

export function mergePropertiesAndGetterValues(
  properties: ProtocolProperty[],
  getterValues: NamedValue[],
  maxEntries: number = Infinity
): [Array<NamedValue | ProtocolProperty>, boolean] {
  const trackedNames: Set<string> = new Set();
  const mergedProperties: Array<NamedValue | ProtocolProperty> = [];

  for (let index = 0; index < properties.length; index++) {
    const property = properties[index];

    if (mergedProperties.length >= maxEntries) {
      return [mergedProperties, true];
    }

    trackedNames.add(property.name);
    mergedProperties.push(property);
  }

  for (let index = 0; index < getterValues.length; index++) {
    if (mergedProperties.length >= maxEntries) {
      return [mergedProperties, true];
    }

    const getterValue = getterValues[index];

    if (!trackedNames.has(getterValue.name)) {
      mergedProperties.push(getterValue);
    }
  }

  return [mergedProperties, false];
}

function isProtocolProperty(
  valueOrProperty: ProtocolValue | ProtocolNamedValue | ProtocolProperty
): valueOrProperty is ProtocolProperty {
  return (
    valueOrProperty.hasOwnProperty("get") ||
    valueOrProperty.hasOwnProperty("isSymbol") ||
    valueOrProperty.hasOwnProperty("set")
  );
}

// TODO It would be nice if the protocol's Value objects used a consistent format.
// As it is, these values have conditional fields which require special handling.
// This utility function maps from one ot the other.
//
// See https://linear.app/replay/issue/BAC-1808
export async function protocolValueToClientValue(
  client: ReplayClientInterface,
  pauseId: ProtocolPauseId,
  protocolValue: ProtocolValue | ProtocolNamedValue | ProtocolProperty
): Promise<Value> {
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
    } else {
      if (isProtocolProperty(protocolValue)) {
        if (protocolValue.hasOwnProperty("get")) {
          objectId = protocolValue.get;
        } else if (protocolValue.hasOwnProperty("set")) {
          objectId = protocolValue.set;
        }
      }
    }

    if (objectId) {
      const object = await objectCache.readAsync(client, pauseId, objectId, "none");
      const className = object.className;

      let preview: string | undefined;
      let type: ValueType = "object";
      switch (className) {
        case "Array":
        case "BigInt64Array":
        case "BigUint64Array":
        case "Float32Array":
        case "Float64Array":
        case "Int8Array":
        case "Int16Array":
        case "Int32Array":
        case "Uint8Array":
        case "Uint8ClampedArray":
        case "Uint16Array":
        case "Uint32Array":
          type = "array";
          break;
        case "Date":
          type = "date";
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
          if (
            className.endsWith("Error") &&
            object.preview?.properties?.find(property => property.name === "message")
          ) {
            type = "error";
          } else if (className.startsWith("HTML")) {
            switch (className) {
              case "HTMLCollection": {
                type = "array";
                break;
              }
              default: {
                type = "html-element";
                break;
              }
            }
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
    const keys = Object.keys(protocolValue).filter(
      key => key !== "flags" && key !== "name" && key !== "isSymbol"
    );
    if (keys.length === 0) {
      return { name, preview: "undefined", type: "undefined" };
    }
  }

  console.error("Unsupported value type:", protocolValue);

  throw Error(`Unsupported value type`);
}

export function primitiveToClientValue(value: any): Value {
  let type: ValueType = "object";
  let preview: string | undefined;

  switch (typeof value) {
    case "bigint":
      preview = `${value}n`;
      type = "bigint";
      break;
    case "boolean":
      preview = `${value}`;
      type = "boolean";
      break;
    case "function":
      preview = `${value}`;
      type = "function";
      break;
    case "number":
      if (Number.isNaN(value)) {
        preview = "NaN";
        type = "nan";
      } else {
        preview = `${value}`;
        type = "number";
      }
      break;
    case "object":
      if (value === null) {
        preview = "null";
        type = "null";
        break;
      } else if (Array.isArray(value)) {
        preview = `[${value}]`;
        type = "array";
        break;
      } else {
        const name = value.constructor.name;
        switch (name) {
          case "Map":
          case "WeakMap":
            preview = `${name}()`;
            type = "map";
            break;
          case "RegExp":
            preview = `${name}()`;
            type = "regexp";
            break;
          case "Set":
          case "WeakSet":
            preview = `${name}()`;
            type = "set";
            break;
          case "Text":
            type = "html-text";
            break;
          default:
            if (name?.startsWith("HTML")) {
              preview = `<${name} />`;
              type = "html-element";
            } else {
              preview = "Object";
            }
            break;
        }
      }
      break;
    case "string":
      preview = value;
      type = "string";
      break;
    case "symbol":
      preview = value.toString();
      type = "symbol";
      break;
    case "undefined":
      preview = "undefined";
      type = "undefined";
      break;
  }

  return {
    name: null,
    preview,
    type,
  };
}

type SourceNode =
  | { type: "protocol"; protocol: string }
  | { type: "origin"; origin: string }
  | {
      type: "source";
      source: Source;
      path: string;
    };

type SourceTree = SourceNode[];

export function sourcesToSourceTree(sources: Source[]): SourceTree {
  const sourceTree: SourceTree = [];

  let protocol: string | null = null;
  let origin: string | null = null;

  sources.forEach(source => {
    if (!source.url) {
      return;
    }

    let url;
    try {
      url = new URL(source.url);
    } catch (error) {
      return;
    }

    if (url.protocol == "replay-content:") {
      return;
    }
    if (
      url.protocol != "replay-content:" &&
      url.protocol != "https:" &&
      url.protocol !== protocol
    ) {
      sourceTree.push({
        type: "protocol",
        protocol: url.protocol,
      });
      protocol = url.protocol;
    }
    if (url.origin != null && url.origin !== origin) {
      sourceTree.push({
        type: "origin",
        origin: url.origin,
      });
      origin = url.origin;
    }
    if (url.pathname) {
      sourceTree.push({
        type: "source",
        source: source,
        path: url.pathname,
      });
    }
  });

  return sourceTree;
}

export type UnknownFunction = (...args: any[]) => any;

export type ChunksArray = (UnknownFunction | string | number)[];

export function splitStringToChunks(string: string) {
  const chunks: string[] = [];
  for (let i = 0; i < string.length; i += 9999) {
    chunks.push(string.slice(i, i + 9999));
  }

  return chunks;
}

export function joinChunksToString(chunks: ProtocolProperty[]): string {
  return chunks
    .filter(isArrayElement)
    .map(prop => prop.value)
    .join("");
}

export function findProtocolObjectProperty(
  sourceObject: ProtocolObject,
  name: string
): ProtocolProperty | NamedValue | null {
  return (
    sourceObject.preview?.properties?.find(property => property.name === name) ??
    sourceObject.preview?.getterValues?.find(property => property.name === name) ??
    null
  );
}

export function findProtocolObjectPropertyValue<Type>(
  sourceObject: ProtocolObject,
  name: string
): Type | null {
  return findProtocolObjectProperty(sourceObject, name)?.value ?? null;
}

export function isArrayElement(property: ProtocolProperty): boolean {
  return /^(0|([1-9]\d*))$/.test(property.name);
}
