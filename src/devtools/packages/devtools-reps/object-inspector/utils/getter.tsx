import React from "react";
import { ValueFront } from "protocol/thread";
import Spinner from "ui/components/shared/Spinner";
import { LabelAndValue, ValueItem } from ".";
import { ObjectInspectorItemProps } from "../components/ObjectInspectorItem";

type ObjectGetterValues = { [property: string]: ValueFront | "loading" | "failed" };
const getterValues = new WeakMap<ValueFront, ObjectGetterValues>();

export class GetterItem {
  readonly type = "getter";
  name: string;
  path: string;
  object: ValueFront;

  // loadingState is:
  // - the ValueFront for the getter's value if it has already been loaded
  // - null if it is currently loading
  // - undefined otherwise
  private loadingState: ValueFront | "loading" | "failed" | undefined;

  constructor(opts: { parent: ValueItem; name: string }) {
    this.name = opts.name;
    this.path = `${opts.parent.path}/${opts.name}`;
    this.object = opts.parent.contents;
    this.loadingState = getterValues.get(this.object)?.[this.name];
  }

  getLoadingState() {
    return this.loadingState;
  }

  isPrimitive() {
    const maybeValue = this.getLoadingState();
    return maybeValue instanceof ValueFront ? maybeValue.isPrimitive() : true;
  }

  getLabelAndValue(props: ObjectInspectorItemProps): LabelAndValue {
    const maybeValue = this.getLoadingState();

    if (maybeValue === undefined) {
      const onClick = async () => {
        let objectGetterValues = getterValues.get(this.object);
        if (!objectGetterValues) {
          objectGetterValues = {};
          getterValues.set(this.object, objectGetterValues);
        }
        objectGetterValues[this.name] = "loading";
        props.forceUpdate();
        const { returned } = await this.object.getProperty(this.name);
        objectGetterValues[this.name] = returned || "failed";
        props.forceUpdate();
      };

      const value = (
        <span onClick={onClick}>
          <button className="invoke-getter" title="Invoke getter"></button>
        </span>
      );
      return { label: this.name, value };
    }

    if (maybeValue === "loading") {
      return { label: this.name, value: <Spinner className="w-3 animate-spin" /> };
    }

    if (maybeValue === "failed") {
      return { label: this.name, value: <span className="unavailable">(failed to load)</span> };
    }

    return new ValueItem({ name: this.name, contents: maybeValue, path: "" }).getLabelAndValue(
      props
    );
  }

  getChildren() {
    const maybeValue = this.getLoadingState();
    if (!(maybeValue instanceof ValueFront)) {
      return [];
    }
    return new ValueItem({ contents: maybeValue, path: "" }).getChildren();
  }
}
