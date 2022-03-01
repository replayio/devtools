import { assert, DisallowEverythingProxyHandler } from "../utils";
import { Pause, WiredContainerEntry, WiredObject } from "./pause";
import { ThreadFront } from "./thread";

type ValueFronts = { name: string; path?: string; contents: ValueFront }[];

// like JSON, but including `undefined`
type JSONishValue =
  | boolean
  | string
  | number
  | null
  | undefined
  | JSONishValue[]
  | { [key: string]: JSONishValue };

// Manages interaction with a value from a pause.
export class ValueFront {
  private _pause: Pause | null;
  private _hasPrimitive: boolean;
  private _primitive: string | number | null | undefined;
  private _isBigInt: boolean;
  private _isSymbol: boolean;
  private _object: WiredObject | null;
  private _uninitialized: boolean;
  private _unavailable: boolean;
  private _elements: ValueFronts | null;
  private _isMapEntry: WiredContainerEntry | null;

  constructor(pause: Pause | null, protocolValue: any, elements?: ValueFronts) {
    this._pause = pause;

    // For primitive values.
    this._hasPrimitive = false;
    this._primitive = undefined;
    this._isBigInt = false;
    this._isSymbol = false;

    // For objects.
    this._object = null;

    // For other kinds of values.
    this._uninitialized = false;
    this._unavailable = false;

    // For arrays of values constructed by the devtools.
    this._elements = null;
    this._isMapEntry = null;

    if (elements) {
      this._elements = elements;
    } else if ("value" in protocolValue) {
      this._hasPrimitive = true;
      this._primitive = protocolValue.value;
    } else if ("object" in protocolValue) {
      const data = pause!.objects.get(protocolValue.object);
      assert(data);
      this._object = data;
    } else if ("unserializableNumber" in protocolValue) {
      this._hasPrimitive = true;
      this._primitive = Number(protocolValue.unserializableNumber);
    } else if ("bigint" in protocolValue) {
      this._hasPrimitive = true;
      this._isBigInt = true;
      this._primitive = protocolValue.bigint;
    } else if ("symbol" in protocolValue) {
      this._hasPrimitive = true;
      this._isSymbol = true;
      this._primitive = protocolValue.symbol;
    } else if ("uninitialized" in protocolValue) {
      this._uninitialized = true;
    } else if ("unavailable" in protocolValue) {
      this._unavailable = true;
    } else {
      // When there are no keys the value is undefined.
      this._hasPrimitive = true;
    }
  }

  getExecutionPoint() {
    return this._pause?.point;
  }

  getPause() {
    return this._pause;
  }

  id() {
    if (this._object) {
      return `${this._pause!.pauseId}:${this._object.objectId}`;
    }
    if (this._hasPrimitive) {
      return String(this._primitive);
    }
    if (this._uninitialized) {
      return "uninitialized";
    }
    if (this._unavailable) {
      return "unavailable";
    }
    if (this._elements) {
      return "elements";
    }
    throw new Error("bad contents");
  }

  isObject() {
    return !!this._object;
  }

  getObject() {
    return this._object;
  }

  objectId() {
    return this._object?.objectId;
  }

  hasPreview() {
    return this._object && this._object.preview;
  }

  hasPreviewOverflow() {
    return !this.hasPreview() || this._object!.preview!.overflow;
  }

  previewValueMap(): { [key: string]: ValueFront } {
    const rv = Object.create(null);
    if (this.hasPreview()) {
      for (const { name, value, get, set } of this._object!.preview!.properties!) {
        // For now, ignore getter/setter properties.
        if (!get && !set) {
          rv[name] = value;
        }
      }
      for (const { name, value } of this._object!.preview!.getterValues!) {
        rv[name] = value;
      }
    }
    return rv;
  }

  previewValueCount() {
    return Object.keys(this.previewValueMap()).length;
  }

  previewContainerEntries() {
    if (this.hasPreview()) {
      return this._object!.preview!.containerEntries;
    }
    return [];
  }

  previewPromiseState() {
    // Older recordings did not set promiseState so this could be null.
    return (this.hasPreview() && this._object!.preview!.promiseState) || null;
  }

  previewProxyState() {
    // Older recordings did not set proxyState so this could be null.
    return (this.hasPreview() && this._object!.preview!.proxyState) || null;
  }

  className() {
    if (this._object) {
      return this._object.className;
    }
  }

  containerEntryCount() {
    return this._object!.preview!.containerEntryCount;
  }

  regexpString() {
    return this._object!.preview!.regexpString;
  }

  dateTime() {
    return this._object!.preview!.dateTime;
  }

  functionName() {
    return this._object!.preview!.functionName;
  }

  functionParameterNames() {
    return this._object!.preview!.functionParameterNames;
  }

  functionLocation() {
    const location = this._object!.preview!.functionLocation;
    if (location) {
      return ThreadFront.getPreferredLocationRaw(location);
    }
  }

  functionLocationURL() {
    const location = this.functionLocation();
    if (location) {
      return ThreadFront.getSourceURLRaw(location.sourceId);
    }
  }

  // When the function came from a logpoint and hasn't had its location
  // mapped yet, this should be used to avoid confusing getPreferredLocation.
  functionLocationFromLogpoint() {
    const location = this._object!.preview!.functionLocation;
    if (location) {
      return location[0];
    }
  }

  isString() {
    return this.isPrimitive() && typeof this.primitive() == "string" && !this._isBigInt;
  }

  isPrimitive() {
    return this._hasPrimitive;
  }

  isBigInt() {
    return this._isBigInt;
  }

  primitive() {
    assert(this._hasPrimitive);
    return this._primitive;
  }

  isMapEntry() {
    return this._isMapEntry;
  }

  isUninitialized() {
    return this._uninitialized;
  }

  isUnavailable() {
    return this._unavailable;
  }

  isNode() {
    return !!this._object!.preview!.node;
  }

  isNodeBoundsFront() {
    return false;
  }

  nodeType() {
    return this._object!.preview!.node!.nodeType;
  }

  nodeName() {
    return this._object!.preview!.node!.nodeName;
  }

  isNodeConnected() {
    return this._object!.preview!.node!.isConnected;
  }

  nodeAttributeMap() {
    const rv = Object.create(null);
    const { attributes } = this._object!.preview!.node!;
    for (const { name, value } of attributes || []) {
      rv[name] = value;
    }
    return rv;
  }

  nodePseudoType() {
    return this._object!.preview!.node!.pseudoType;
  }

  documentURL() {
    return this._object!.preview!.node!.documentURL;
  }

  isScope() {
    return false;
  }

  hasChildren() {
    return false;
    //return this.isObject();
  }

  getNodeFront() {
    if (this._pause && this._object?.preview?.node) {
      return this._pause.getNodeFront(this._object.objectId);
    }
  }

  getChildren(): ValueFronts {
    if (this._elements) {
      return this._elements;
    }
    if (this.hasPreviewOverflow()) {
      // See ObjectInspectorItem.js
      return [
        {
          name: "Loading…",
          contents: createUnavailableValueFront(),
        },
      ];
    }
    const previewValues = this.previewValueMap();
    const rv = Object.entries(previewValues).map(([name, contents]) => ({
      name,
      contents,
    }));
    rv.sort((a, b) => {
      // if both element names are numbers, sort them numerically instead of
      // alphabetically.
      const aN = Number.parseInt(a.name);
      const bN = Number.parseInt(b.name);
      if (!isNaN(aN) && !isNaN(bN)) {
        return aN - bN;
      }

      const _a = a.name?.toUpperCase();
      const _b = b.name?.toUpperCase();
      return _a < _b ? -1 : _a > _b ? 1 : 0;
    });
    if (["Set", "WeakSet", "Map", "WeakMap"].includes(this.className()!)) {
      const elements = this.previewContainerEntries()!.map(({ key, value }, i) => {
        if (key) {
          const entryElements = [
            { name: "<key>", contents: key },
            { name: "<value>", contents: value },
          ];
          const entry = createElementsFront(entryElements);
          entry._isMapEntry = { key, value };
          return { name: i.toString(), contents: entry };
        } else {
          return { name: i.toString(), contents: value };
        }
      });
      rv.unshift({
        name: "<entries>",
        contents: createElementsFront(elements),
      });
    }
    if (this.className() === "Promise") {
      const result = this.previewPromiseState();
      if (result) {
        const { state, value } = result;

        if (value) {
          rv.unshift({
            name: "<value>",
            contents: value,
          });
        }
        rv.unshift({
          name: "<state>",
          contents: state,
        });
      }
    }

    if (this.className() === "Proxy") {
      const result = this.previewProxyState();
      if (result) {
        const { target, handler } = result;

        rv.unshift({
          name: "<handler>",
          contents: handler,
        });
        rv.unshift({
          name: "<target>",
          contents: target,
        });
      }
    } else {
      rv.push({
        name: "<prototype>",
        contents: this._object!.preview!.prototypeValue,
      });
    }
    return rv;
  }

  async loadDirectChildren() {
    // Make sure we know all this node's children.
    if (this.isObject() && this.hasPreviewOverflow()) {
      await this.getPause()!.getObjectPreview(this._object!.objectId);
      assert(!this.hasPreviewOverflow());
    }

    return this.getChildren();
  }

  async loadChildren() {
    // Make sure we know all this node's children.
    if (this.isObject() && this.hasPreviewOverflow()) {
      await this.getPause()!.getObjectPreview(this._object!.objectId);
      assert(!this.hasPreviewOverflow());
    }

    const children = this.getChildren()!;

    // Make sure we have previews for all of this node's object children.
    const promises = [];
    for (const { contents } of children) {
      if (contents.isObject() && !contents.hasPreview()) {
        promises.push(contents.getPause()!.getObjectPreview(contents._object!.objectId));
      }
    }
    await Promise.all(promises);

    for (const { contents } of children) {
      if (contents.isObject()) {
        assert(contents.hasPreview());
      }
    }

    return children;
  }

  /**
   * Recursively create a representation of this value, similar to a JSON value
   * but including `undefined`. If the object graph of this value contains a
   * circular reference, it is replaced by `undefined`.
   */
  async getJSON(visitedObjectIds = new Set<string>()): Promise<JSONishValue> {
    await this.loadChildren();

    if (this.isPrimitive()) {
      return this.primitive();
    }

    if (this.isObject()) {
      const objectId = this._object!.objectId;
      if (visitedObjectIds.has(objectId)) {
        return undefined;
      }

      visitedObjectIds = new Set(visitedObjectIds);
      visitedObjectIds.add(objectId);

      const properties = await Promise.all(
        Object.entries(this.previewValueMap()).map(async ([key, valueFront]) => {
          const value = await valueFront.getJSON(visitedObjectIds);
          return [key, value] as [string, JSONishValue];
        })
      );

      if (this.className() === "Array") {
        let result: JSONishValue[] = [];
        for (const [key, value] of properties) {
          const index = parseInt(key);
          if (Number.isInteger(index)) {
            result[index] = value;
          }
        }
        return result;
      } else {
        return Object.fromEntries(properties);
      }
    }

    return undefined;
  }
}

Object.setPrototypeOf(ValueFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));

export type PrimitiveValue = string | number | boolean | null | undefined;
export function createPrimitiveValueFront(value: PrimitiveValue, pause: Pause | null = null) {
  return new ValueFront(pause, { value });
}

export function createElementsFront(elements: ValueFronts) {
  elements.forEach(({ contents }) => contents.isObject());
  return new ValueFront(null, undefined, elements);
}

export function createUnavailableValueFront() {
  return new ValueFront(null, { unavailable: true });
}
