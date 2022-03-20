import { assert } from "protocol/utils";
import { IItem, Item, LabelAndValue } from ".";

export class ContainerItem implements IItem {
  readonly type = "container";
  name: string;
  path: string;
  contents: Item[];

  constructor(opts: { name: string; contents: Item[] } & ({ parent: Item } | { path: string })) {
    this.name = opts.name;
    this.path = "parent" in opts ? `${opts.parent.path}/${opts.name}` : opts.path;
    this.contents = opts.contents;
  }

  isPrimitive(): boolean {
    return false;
  }

  getLabelAndValue(): LabelAndValue {
    return { label: this.name };
  }

  getChildren(): Item[] {
    return this.contents;
  }

  shouldUpdate(prevItem: Item) {
    assert(this.type === prevItem.type, "OI items for the same path must have the same type");
    return false;
  }
}
