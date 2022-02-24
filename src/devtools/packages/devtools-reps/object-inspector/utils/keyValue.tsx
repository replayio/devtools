import { ValueFront } from "protocol/thread";
import { IItem, Item, LabelAndValue, ValueItem } from ".";
import { ObjectInspectorItemProps } from "../components/ObjectInspectorItem";
const PropRep = require("../../reps/prop-rep");

export class KeyValueItem implements IItem {
  readonly type = "key-value";
  name: string;
  path: string;
  key: ValueFront;
  value: ValueFront;

  constructor(opts: { name: string; path: string; key: ValueFront; value: ValueFront }) {
    this.name = opts.name;
    this.path = opts.path;
    this.key = opts.key;
    this.value = opts.value;
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
}
