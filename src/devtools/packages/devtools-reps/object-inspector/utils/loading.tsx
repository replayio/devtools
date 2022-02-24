import { IItem, Item, LabelAndValue } from ".";

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
}
