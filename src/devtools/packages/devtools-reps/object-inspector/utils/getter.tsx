import React from "react";
import { ValueFront } from "protocol/thread";
import Spinner from "ui/components/shared/Spinner";
import { LabelAndValue, ValueItem } from ".";
import { ObjectInspectorItemProps } from "../components/ObjectInspectorItem";

function getterValueKey(object: ValueFront, property: string) {
  return `${object.objectId()}:${property}`;
}
const getterValues = new Map<string, ValueFront | "loading" | "failed">();

export class GetterItem {
  readonly type = "getter";
  name: string;
  path: string;
  object: ValueFront;

  // loadingState is:
  // - undefined - by default (not loaded)
  // - "loading" - if it is currently loading
  // - "failed" - if loading failed
  // - ValueFront - the getter's value once it's been loaded
  readonly loadingState: undefined | "loading" | "failed" | ValueFront;

  constructor(opts: { parent: ValueItem; name: string }) {
    this.name = opts.name;
    this.path = `${opts.parent.path}/${opts.name}`;
    this.object = opts.parent.contents;
    this.loadingState = getterValues.get(getterValueKey(this.object, this.name));
  }

  getLoadingState() {
    return this.loadingState;
  }

  isPrimitive() {
    return this.loadingState instanceof ValueFront ? this.loadingState.isPrimitive() : true;
  }

  getLabelAndValue(props: ObjectInspectorItemProps): LabelAndValue {
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
        return { label: this.name, value };
      }

      case "loading": {
        return { label: this.name, value: <Spinner className="w-3 animate-spin" /> };
      }

      case "failed": {
        return { label: this.name, value: <span className="unavailable">(failed to load)</span> };
      }

      default: {
        return new ValueItem({
          name: this.name,
          contents: this.loadingState,
          path: "",
        }).getLabelAndValue(props);
      }
    }
  }

  getChildren() {
    if (!(this.loadingState instanceof ValueFront)) {
      return [];
    }
    return new ValueItem({ contents: this.loadingState, path: "" }).getChildren();
  }
}
