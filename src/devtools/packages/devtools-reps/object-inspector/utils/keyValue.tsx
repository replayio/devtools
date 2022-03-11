import { ValueFront } from "protocol/thread";
import { assert } from "protocol/utils";
import { IItem, isValueLoaded, Item, LabelAndValue, ValueItem } from ".";
import { ObjectInspectorItemProps } from "../components/ObjectInspectorItem";
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

  shouldUpdate(prevItem: Item) {
    assert(this.type === prevItem.type, "OI items for the same path must have the same type");
    return this.childrenLoaded !== prevItem.childrenLoaded;
  }
}
