import { assert, DisallowEverythingProxyHandler } from "../utils";
import { Pause, WiredContainerEntry, WiredObject } from "./pause";
import { ThreadFront } from "./thread";

type ValueFronts = { name: string; path?: string; contents: ValueFront }[];

// Manages interaction with a value from a pause.
export class ValueFront {
  private _pause: Pause | null;
  private _hasPrimitive: boolean;
  private _primitive: string | number | null | undefined;
  private _isBigInt: boolean;
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
    rv.push({
      name: "<prototype>",
      contents: this._object!.preview!.prototypeValue,
    });
    return rv;
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
}

Object.setPrototypeOf(ValueFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));

export function createPrimitiveValueFront(value: string | number | null | undefined) {
  return new ValueFront(null, { value });
}

export function createElementsFront(elements: ValueFronts) {
  elements.forEach(({ contents }) => contents.isObject());
  return new ValueFront(null, undefined, elements);
}

export function createUnavailableValueFront() {
  return new ValueFront(null, { unavailable: true });
}
