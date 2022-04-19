import { ValueFront } from "protocol/thread";
import { assert } from "protocol/utils";

import { ObjectInspectorItemProps } from "../components/ObjectInspectorItem";

import { IItem, isValueLoaded, Item, LabelAndValue, ValueItem } from ".";

const PropRep = require("../../reps/prop-rep");

export class KeyValueItem implements IItem {
  readonly type = "key-value";
  name: string;
  path: string;
  key: ValueFront;
  value: ValueFront;
  childrenLoaded: boolean;

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
            equal: " \u2192 ",
            name: this.key,
            object: this.value,
            suppressQuotes: false,
            title: null,
          })}
        </span>
      ),
    };
  }

  getChildren(): Item[] {
    return [
      new ValueItem({ contents: this.key, name: "<key>", parent: this }),
      new ValueItem({ contents: this.value, name: "<value>", parent: this }),
    ];
  }

  shouldUpdate(prevItem: Item) {
    assert(this.type === prevItem.type, "OI items for the same path must have the same type");
    return this.childrenLoaded !== prevItem.childrenLoaded;
  }
}
