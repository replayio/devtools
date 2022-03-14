import React from "react";
import { ValueFront } from "protocol/thread";
import Spinner from "ui/components/shared/Spinner";
import { Item, LabelAndValue, ValueItem } from ".";
import { ObjectInspectorItemProps } from "../components/ObjectInspectorItem";
import { assert } from "protocol/utils";

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
