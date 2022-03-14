import { assert, DisallowEverythingProxyHandler } from "../utils";
import { EvaluationResult, Pause, WiredObject } from "./pause";
import { ThreadFront } from "./thread";

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

  constructor(pause: Pause | null, protocolValue: any) {
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

    if ("value" in protocolValue) {
      this._hasPrimitive = true;
      this._primitive = protocolValue.value;
    } else if ("object" in protocolValue) {
      const data = pause!.objects.get(protocolValue.object);
      assert(data, "object preview not found");
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

  previewValueMap(): Map<string, ValueFront> {
    const rv = new Map<string, ValueFront>();
    if (this.hasPreview()) {
      for (const { name, value, get, set } of this._object!.preview!.properties!) {
        // For now, ignore getter/setter properties.
        if (!get && !set) {
          rv.set(name, value);
        }
      }
      for (const { name, value } of this._object!.preview!.getterValues!) {
        rv.set(name, value);
      }
    }
    return rv;
  }

  previewValueCount() {
    return this.previewValueMap().size;
  }

  previewGetters(): Map<string, ValueFront> {
    const rv = new Map<string, ValueFront>();
    if (!this._object?.preview?.properties) {
      return rv;
    }
    const valueMap = this.previewValueMap();
    for (const { name, get } of this._object.preview.properties) {
      if (get && !valueMap.has(name)) {
        rv.set(name, get);
      }
    }
    return rv;
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

  previewPrototypeValue() {
    return (this.hasPreview() && this._object!.preview!.prototypeValue) || null;
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
    assert(this._hasPrimitive, "must be a primitive value");
    return this._primitive;
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

  getProperty(property: string): Promise<EvaluationResult> {
    assert(this._pause, "no pause");
    assert(this._object, "no object to get property of");
    return this._pause.getObjectProperty(this._object.objectId, property);
  }

  async load() {
    await this.getPause()!.getObjectPreview(this._object!.objectId);
  }

  async loadIfNecessary() {
    if (this.isObject() && this.hasPreviewOverflow()) {
      await this.load();
      assert(!this.hasPreviewOverflow(), "object still has previewOverflow after loading");
    }
  }

  async loadProperties() {
    if (!this.isObject()) {
      return;
    }

    // Make sure we know all this node's children.
    if (this.hasPreviewOverflow()) {
      await this.getPause()!.getObjectPreview(this._object!.objectId);
      assert(!this.hasPreviewOverflow(), "object still has previewOverflow after loading");
    }

    // Make sure we have previews for all of this node's object properties.
    const propertyValues = this.previewValueMap().values();
    const promises = [];
    for (const value of propertyValues) {
      if (value.isObject() && !value.hasPreview()) {
        promises.push(value.getPause()!.getObjectPreview(value._object!.objectId));
      }
    }
    await Promise.all(promises);

    for (const value of propertyValues) {
      if (value.isObject()) {
        assert(value.hasPreview(), "no object preview");
      }
    }
  }

  /**
   * walks down this object's prototype chain up to maxDepth levels
   * and calls visitFn on this object and the visited prototypes
   */
  traversePrototypeChain(visitFn: (current: ValueFront) => unknown, maxDepth: number): void {
    visitFn(this);
    if (maxDepth > 0) {
      this.previewPrototypeValue()?.traversePrototypeChain(visitFn, maxDepth - 1);
    }
  }

  /**
   * walks down this object's prototype chain up to maxDepth levels
   * and calls visitFn on this object and the visited prototypes
   */
  async traversePrototypeChainAsync(
    visitFn: (current: ValueFront) => Promise<unknown>,
    maxDepth: number
  ): Promise<void> {
    await visitFn(this);
    if (maxDepth > 0) {
      await this.previewPrototypeValue()?.traversePrototypeChainAsync(visitFn, maxDepth - 1);
    }
  }

  /**
   * Recursively create a representation of this value, similar to a JSON value
   * but including `undefined`. If the object graph of this value contains a
   * circular reference, it is replaced by `undefined`.
   */
  async getJSON(visitedObjectIds = new Set<string>()): Promise<JSONishValue> {
    await this.loadProperties();

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
        [...this.previewValueMap().entries()].map(async ([key, valueFront]) => {
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

export function createUnavailableValueFront() {
  return new ValueFront(null, { unavailable: true });
}
