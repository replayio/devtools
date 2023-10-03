import assert from "assert";

type Callback = () => void;
type Unsubscribe = () => void;

export abstract class GenericListData<Item> {
  private _cachedItemToIndexMap: Map<Item, number> = new Map();
  private _cachedIndexToItemMap: Map<number, Item> = new Map();
  private _cachedItemCount: number | null = null;
  private _revision: number = 0;
  private _subscribers: Set<Callback> = new Set();

  getIndexForItem(item: Item): number {
    let index = this._cachedItemToIndexMap.get(item);
    if (index != null) {
      return index;
    }

    index = this.getIndexForItemImplementation(item);

    this._cachedItemToIndexMap.set(item, index);

    return index;
  }

  getItemAtIndex(index: number): Item {
    assert(
      index >= 0 && index < this.getItemCount(),
      `Invalid index specified (${index}); list contains ${this.getItemCount()} items.`
    );

    let item = this._cachedIndexToItemMap.get(index);
    if (item != null) {
      return item;
    }

    item = this.getItemAtIndexImplementation(index);

    this._cachedIndexToItemMap.set(index, item);

    return item;
  }

  getItemCount = (): number => {
    if (this._cachedItemCount != null) {
      return this._cachedItemCount;
    }

    const count = this.getItemCountImplementation();

    this._cachedItemCount = count;

    return count;
  };

  getRevision = (): number => {
    return this._revision;
  };

  subscribe = (callback: Callback): Unsubscribe => {
    this._subscribers.add(callback);

    return () => {
      this._subscribers.delete(callback);
    };
  };

  // Not all list types require this functionality
  protected getIndexForItemImplementation(item: Item): number {
    throw Error("getIndexForItemImplementation not implemented");
  }

  protected abstract getItemAtIndexImplementation(index: number): Item;

  protected abstract getItemCountImplementation(): number;

  protected invalidate(): void {
    this._cachedItemToIndexMap.clear();
    this._cachedIndexToItemMap.clear();
    this._cachedItemCount = null;
    this._revision++;

    this._subscribers.forEach(callback => callback());
  }
}
