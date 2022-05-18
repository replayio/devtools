import { ValueFront } from "protocol/thread";
import { assert } from "protocol/utils";
import Spinner from "ui/components/shared/Spinner";

import { MODE } from "../../reps/constants";
import ErrorRep from "../../reps/error";
import PropRep from "../../reps/prop-rep";
import { ObjectInspectorItemProps } from "../components/ObjectInspectorItem";

export * from "./utils";

import {
  GETTERS_FROM_PROTOTYPES,
  isValueLoaded,
  getChildValues,
  renderRep,
  loadValue,
} from "./utils";

export interface LabelAndValue {
  label?: React.ReactNode;
  value?: React.ReactNode;
}

export type Item = ValueItem | KeyValueItem | ContainerItem | GetterItem | LoadingItem;

export interface IItem {
  readonly type: string;
  name: string | undefined;
  path: string;
  isPrimitive(): boolean;
  getLabelAndValue(props: ObjectInspectorItemProps): LabelAndValue;
  getChildren(): Item[];
  shouldUpdate(prevItem: Item): boolean;
}

// An Item represents one node in the ObjectInspector tree:
// ValueItems represent nodes that correspond to a ValueFront (i.e. a javascript value in the debuggee)
// KeyValueItems represent nodes for entries in a native javascript container (i.e. Map, WeakMap, Set and WeakSet)
// ContainerItems represent nodes with an arbitrary list of child nodes
// - this is used to represent Scopes and the <entries> node of a native javascript container, for example
// GetterItems represent nodes for getters
// LoadingItem represents the "Loading…" node shown while a node's children are being loaded

export class ContainerItem implements IItem {
  readonly type = "container";
  readonly name: string;
  readonly path: string;
  readonly contents: Item[];
  readonly childrenLoaded: boolean;

  constructor(opts: { name: string; contents: Item[] } & ({ parent: Item } | { path: string })) {
    this.name = opts.name;
    this.path = "parent" in opts ? `${opts.parent.path}/${opts.name}` : opts.path;
    this.contents = opts.contents;
    this.childrenLoaded = this.contents.every(item => item.type !== "value" || item.loaded);
  }

  isPrimitive(): boolean {
    return false;
  }

  getLabelAndValue(): LabelAndValue {
    return { label: this.name };
  }

  getChildren(): Item[] {
    return this.contents.map(item => (item.type === "value" ? item.recreate() : item));
  }

  async loadChildren() {
    await Promise.all(this.contents.map(item => item.type === "value" && loadValue(item.contents)));
  }

  shouldUpdate(prevItem: Item) {
    assert(this.type === prevItem.type, "OI items for the same path must have the same type");
    return false;
  }
}

function getterValueKey(object: ValueFront, property: string) {
  return `${object.getPause()?.pauseId}:${object.objectId()}:${property}`;
}
const getterValues = new Map<string, ValueFront | "loading" | "failed">();

export class GetterItem {
  readonly type = "getter";
  name: string;
  path: string;
  object: ValueFront;
  getterFn: ValueFront;
  getterFnLoaded: boolean;

  // loadingState is:
  // - undefined - by default (not loaded)
  // - "loading" - if it is currently loading
  // - "failed" - if loading failed
  // - ValueFront - the getter's value once it's been loaded
  readonly loadingState: undefined | "loading" | "failed" | ValueFront;
  readonly valueItem?: ValueItem;

  constructor(opts: { parent: ValueItem; name: string; getterFn: ValueFront }) {
    this.name = opts.name;
    this.path = `${opts.parent.path}/${opts.name}`;
    this.object = opts.parent.contents;
    this.getterFn = opts.getterFn;
    this.getterFnLoaded = !this.getterFn.hasPreviewOverflow();
    this.loadingState = getterValues.get(getterValueKey(this.object, this.name));
    if (this.loadingState instanceof ValueFront) {
      this.valueItem = new ValueItem({
        name: this.name,
        contents: this.loadingState,
        path: this.path,
      });
    }
  }

  isPrimitive() {
    return this.loadingState instanceof ValueFront ? this.loadingState.isPrimitive() : true;
  }

  getLabelAndValue(props: ObjectInspectorItemProps): LabelAndValue {
    const label = this.getLabel(props);
    switch (this.loadingState) {
      case undefined: {
        const onClick = async () => {
          const key = getterValueKey(this.object, this.name);
          getterValues.set(key, "loading");
          props.forceUpdate();
          const { returned } = await this.object.getProperty(this.name);
          getterValues.set(key, returned || "failed");
          props.forceUpdate();
        };

        const value = (
          <span onClick={onClick}>
            <button className="invoke-getter" title="Invoke getter"></button>
          </span>
        );
        return { label, value };
      }

      case "loading": {
        return { label, value: <Spinner className="w-3 animate-spin" /> };
      }

      case "failed": {
        return { label, value: <span className="unavailable">(failed to load)</span> };
      }

      default: {
        const { value } = this.valueItem!.getLabelAndValue(props);
        return { label, value };
      }
    }
  }

  private getLabel(props: ObjectInspectorItemProps) {
    if (this.getterFn.hasPreviewOverflow()) {
      return this.name;
    }
    const url = this.getterFn.functionLocationURL();
    const location = this.getterFn.functionLocation();
    if (!url || !location) {
      return this.name;
    }
    const onClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      props.onViewSourceInDebugger({
        url,
        line: location.line,
        column: location.column,
      });
    };
    return (
      <span>
        {this.name}
        <button
          className="jump-definition"
          draggable={false}
          title="Jump to definition"
          onClick={onClick}
        />
      </span>
    );
  }

  getChildren() {
    return this.valueItem?.getChildren() || [];
  }

  shouldUpdate(prevItem: Item) {
    assert(this.type === prevItem.type, "OI items for the same path must have the same type");
    if (
      this.getterFnLoaded !== prevItem.getterFnLoaded ||
      this.loadingState !== prevItem.loadingState
    ) {
      return true;
    }
    if (this.valueItem && prevItem.valueItem) {
      return this.valueItem.shouldUpdate(prevItem.valueItem);
    }
    return false;
  }
}

export class KeyValueItem implements IItem {
  readonly type = "key-value";
  readonly name: string;
  readonly path: string;
  readonly key: ValueFront;
  readonly value: ValueFront;
  readonly childrenLoaded: boolean;

  constructor(opts: { name: string; path: string; key: ValueFront; value: ValueFront }) {
    this.name = opts.name;
    this.path = opts.path;
    this.key = opts.key;
    this.value = opts.value;
    this.childrenLoaded = isValueLoaded(this.key) && isValueLoaded(this.value);
  }

  isPrimitive(): boolean {
    return false;
  }

  getLabelAndValue(props: ObjectInspectorItemProps): LabelAndValue {
    return {
      label: this.name,
      value: (
        <span>
          {PropRep({
            ...props,
            name: this.key,
            object: this.value,
            equal: " \u2192 ",
            title: null,
            suppressQuotes: false,
          })}
        </span>
      ),
    };
  }

  getChildren(): Item[] {
    return [
      new ValueItem({ parent: this, name: "<key>", contents: this.key }),
      new ValueItem({ parent: this, name: "<value>", contents: this.value }),
    ];
  }

  async loadChildren() {
    await Promise.all([loadValue(this.key), loadValue(this.value)]);
  }

  shouldUpdate(prevItem: Item) {
    assert(this.type === prevItem.type, "OI items for the same path must have the same type");
    return this.childrenLoaded !== prevItem.childrenLoaded;
  }
}

export class LoadingItem implements IItem {
  readonly type = "loading";
  name = undefined;
  path: string;

  constructor(opts: { parent: Item }) {
    this.path = `${opts.parent.path}/loading`;
  }

  isPrimitive(): boolean {
    return true;
  }

  getLabelAndValue(): LabelAndValue {
    return { label: "Loading…" };
  }

  getChildren(): Item[] {
    return [];
  }

  shouldUpdate(prevItem: Item) {
    assert(this.type === prevItem.type, "OI items for the same path must have the same type");
    return false;
  }
}

export class ValueItem implements IItem {
  readonly type = "value";
  readonly name: string | undefined;
  readonly path: string;
  readonly contents: ValueFront;
  readonly isInCurrentPause?: boolean;
  readonly loaded: boolean;
  readonly childrenLoaded: boolean;

  constructor(
    opts: { name?: string; contents: ValueFront; isInCurrentPause?: boolean } & (
      | { parent: Item }
      | { path: string }
    )
  ) {
    this.name = opts.name;
    this.path = "path" in opts ? opts.path : `${opts.parent.path}/${opts.name}`;
    this.contents = opts.contents;
    this.isInCurrentPause = opts.isInCurrentPause;
    this.loaded = isValueLoaded(this.contents);
    this.childrenLoaded =
      this.loaded && getChildValues(this.contents).every(value => isValueLoaded(value));
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
    if (!this.childrenLoaded) {
      return [new LoadingItem({ parent: this })];
    }

    const value = this.contents;
    const previewValues = value.previewValueMap();
    const rv: Item[] = [...previewValues.entries()].map(
      ([name, contents]) => new ValueItem({ parent: this, name, contents })
    );
    const knownProperties = new Set(previewValues.keys());
    value.traversePrototypeChain(current => {
      const getters = current.previewGetters();
      for (const [name, getterFn] of getters.entries()) {
        if (!knownProperties.has(name)) {
          rv.push(new GetterItem({ parent: this, name, getterFn }));
          knownProperties.add(name);
        }
      }
    }, GETTERS_FROM_PROTOTYPES);
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

  async loadChildren() {
    // ensure we have the prototype chain so that getChildValues()
    // will find all getters
    await this.contents.traversePrototypeChainAsync(async current => {
      await current.loadIfNecessary();
    }, GETTERS_FROM_PROTOTYPES);

    await Promise.all(getChildValues(this.contents).map(loadValue));
  }

  recreate() {
    return new ValueItem({
      contents: this.contents,
      isInCurrentPause: this.isInCurrentPause,
      name: this.name,
      path: this.path,
    });
  }

  shouldUpdate(prevItem: Item) {
    return (
      this.type !== prevItem.type ||
      this.childrenLoaded !== prevItem.childrenLoaded ||
      this.isInCurrentPause !== prevItem.isInCurrentPause
    );
  }
}
