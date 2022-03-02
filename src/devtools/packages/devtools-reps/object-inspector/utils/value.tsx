import React from "react";
import { ValueFront } from "protocol/thread/value";
import { MODE } from "../../reps/constants";
import ErrorRep from "../../reps/error";
import {
  ContainerItem,
  GetterItem,
  GETTERS_FROM_PROTOTYPES,
  IItem,
  Item,
  KeyValueItem,
  LabelAndValue,
  LoadingItem,
  renderRep,
} from ".";
import { ObjectInspectorItemProps } from "../components/ObjectInspectorItem";

export class ValueItem implements IItem {
  readonly type = "value";
  name: string | undefined;
  path: string;
  contents: ValueFront;
  private childrenLoaded: boolean;

  constructor(
    opts: { name?: string; contents: ValueFront } & ({ parent: Item } | { path: string })
  ) {
    this.name = opts.name;
    this.path = "path" in opts ? opts.path : `${opts.parent.path}/${opts.name}`;
    this.contents = opts.contents;
    this.childrenLoaded =
      !this.needsToLoad() && getChildValues(this.contents).every(value => isValueLoaded(value));
  }

  needsToLoad(): boolean {
    return !isValueLoaded(this.contents);
  }

  needsToLoadChildren(): boolean {
    return !this.childrenLoaded;
  }

  isPrimitive(): boolean {
    return (
      this.contents.isPrimitive() ||
      this.contents.isUninitialized() ||
      this.contents.isUnavailable()
    );
  }

  isObject(): boolean {
    return this.contents.isObject();
  }

  isFunction(): boolean {
    return this.contents.className() === "Function";
  }

  isError(): boolean {
    return ErrorRep.supportsObject(this.contents);
  }

  isOptimizedOut(): boolean {
    return this.contents.isUnavailable();
  }

  isPrototype(): boolean {
    return this.name === "<prototype>";
  }

  isUninitializedBinding(): boolean {
    return this.contents.isUninitialized();
  }

  isWindow(): boolean {
    return this.contents.className() === "Window";
  }

  getLabelAndValue(props: ObjectInspectorItemProps): LabelAndValue {
    const { depth, expanded, mode } = props;
    const label = this.name;

    if (this.isOptimizedOut()) {
      return { label, value: <span className="unavailable">(optimized away)</span> };
    }

    if (this.isUninitializedBinding()) {
      return { label, value: <span className="unavailable">(uninitialized)</span> };
    }

    if (this.isFunction() && (mode === MODE.TINY || !mode)) {
      return {
        label: renderRep(this, {
          ...props,
          functionName: label,
        }),
      };
    }

    if (this.isObject() || this.isPrimitive()) {
      const repProps: ObjectInspectorItemProps = { ...props };
      if (depth > 0) {
        repProps.mode = mode === MODE.LONG ? MODE.SHORT : MODE.TINY;
      }
      if (expanded || this.isPrototype()) {
        repProps.mode = MODE.TINY;
      }

      return {
        label,
        value: renderRep(this, repProps),
      };
    }

    return {
      label,
    };
  }

  getChildren(): Item[] {
    if (this.needsToLoad()) {
      return [new LoadingItem({ parent: this })];
    }

    const value = this.contents;
    const previewValues = value.previewValueMap();
    const rv: Item[] = Object.entries(previewValues).map(
      ([name, contents]) => new ValueItem({ parent: this, name, contents })
    );
    const knownProperties = new Set(Object.keys(previewValues));
    for (
      let i = 0, currentValue: ValueFront | null = value;
      i <= GETTERS_FROM_PROTOTYPES && currentValue;
      i++, currentValue = currentValue.previewPrototypeValue()
    ) {
      const getters = currentValue.previewGetters();
      for (const name of Object.keys(getters)) {
        if (!knownProperties.has(name)) {
          rv.push(new GetterItem({ parent: this, name }));
          knownProperties.add(name);
        }
      }
    }
    rv.sort((a, b) => {
      // if both element names are numbers, sort them numerically instead of
      // alphabetically.
      const aN = Number.parseInt(a.name!);
      const bN = Number.parseInt(b.name!);
      if (!isNaN(aN) && !isNaN(bN)) {
        return aN - bN;
      }

      const _a = a.name!.toUpperCase();
      const _b = b.name!.toUpperCase();
      return _a < _b ? -1 : _a > _b ? 1 : 0;
    });

    if (["Set", "WeakSet", "Map", "WeakMap"].includes(value.className()!)) {
      const elements = value.previewContainerEntries()!.map(({ key, value }, i) => {
        if (key) {
          return new KeyValueItem({
            name: i.toString(),
            path: `${this.path}/<entries>/${i}`,
            key,
            value,
          });
        } else {
          return new ValueItem({
            name: i.toString(),
            path: `${this.path}/<entries>/${i}`,
            contents: value,
          });
        }
      });
      rv.unshift(new ContainerItem({ parent: this, name: "<entries>", contents: elements }));
    }

    if (value.className() === "Promise") {
      const result = value.previewPromiseState();
      if (result) {
        const { state, value } = result;
        if (value) {
          rv.unshift(new ValueItem({ parent: this, name: "<value>", contents: value }));
        }
        rv.unshift(new ValueItem({ parent: this, name: "<state>", contents: state }));
      }
    }

    if (value.className() === "Proxy") {
      const result = value.previewProxyState();
      if (result) {
        const { target, handler } = result;
        rv.unshift(new ValueItem({ parent: this, name: "<handler>", contents: handler }));
        rv.unshift(new ValueItem({ parent: this, name: "<target>", contents: target }));
      }
    } else {
      const prototypeValue = value.previewPrototypeValue();
      if (prototypeValue) {
        rv.push(new ValueItem({ parent: this, name: "<prototype>", contents: prototypeValue }));
      }
    }

    return rv;
  }
}

function getChildValues(parentValue: ValueFront): ValueFront[] {
  const rv = Object.values(parentValue.previewValueMap());

  if (parentValue.className() === "Promise") {
    const result = parentValue.previewPromiseState();
    if (result) {
      const { state, value } = result;
      if (value) {
        rv.push(value);
      }
      rv.push(state);
    }
  }

  if (parentValue.className() === "Proxy") {
    const result = parentValue.previewProxyState();
    if (result) {
      const { target, handler } = result;
      rv.push(handler);
      rv.push(target);
    }
  } else {
    const prototypeValue = parentValue.previewPrototypeValue();
    if (prototypeValue) {
      rv.push(prototypeValue);
    }
  }

  return rv;
}

function isValueLoaded(value: ValueFront): boolean {
  return value.isPrimitive() || !value.hasPreviewOverflow();
}
