import { assert } from "protocol/utils";
import { IItem, Item, LabelAndValue } from ".";

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
    await Promise.all(
      this.contents.map(item => item.type === "value" && item.contents.loadIfNecessary())
    );
  }

  shouldUpdate(prevItem: Item) {
    assert(this.type === prevItem.type, "OI items for the same path must have the same type");
    return false;
  }
}
