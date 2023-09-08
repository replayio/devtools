type Callback = () => void;
type Unsubscribe = () => void;

export abstract class GenericListData<Item, ItemData> {
  private _cachedItemCount: number | null = null;
  private _cachedIndexToItemMap: Map<number, Item> = new Map();
  private _subscribers: Set<Callback> = new Set();

  protected abstract getItemCountImplementation(): number;
  protected abstract getItemAtIndexImplementation(index: number): Item;
  protected abstract updateItemDataImplementation(itemData: ItemData): boolean;

  getItemAtIndex(index: number): Item {
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

  subscribe = (callback: Callback): Unsubscribe => {
    this._subscribers.add(callback);

    return () => {
      this._subscribers.delete(callback);
    };
  };

  updateItemData(itemData: ItemData) {
    const didItemCountChange = this.updateItemDataImplementation(itemData);
    if (didItemCountChange) {
      this._cachedIndexToItemMap.clear();
      this._cachedItemCount = null;

      this._subscribers.forEach(callback => callback());
    }
  }
}
