import assert from "assert";
import { Deferred, STATUS_RESOLVED, createDeferred } from "suspense";

import { EventEmitter } from "shared/EventEmitter";

export abstract class GenericListData<Item> extends EventEmitter<{
  invalidate: () => void;
  loading: (value: boolean) => void;
  selectedIndex: (index: number | null) => void;
}> {
  private _cachedItemToIndexMap: Map<Item, number> = new Map();
  private _cachedIndexToItemMap: Map<number, Item> = new Map();
  private _cachedItemCount: number | null = null;
  private _isLoading: boolean = false;
  private _loadingWaiter: Deferred<void> = createDeferred();
  private _revision: number = 0;
  private _selectedIndex: number | null = null;

  constructor() {
    super();

    this._loadingWaiter.resolve();
  }

  getIndexForItem(item: Item): number {
    let index = this._cachedItemToIndexMap.get(item);
    if (index != null) {
      return index;
    }

    index = this.getIndexForItemImplementation(item);

    this._cachedItemToIndexMap.set(item, index);

    return index;
  }

  getIsLoading = () => {
    return this._isLoading;
  };

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

  getSelectedIndex = (): number | null => {
    return this._selectedIndex;
  };

  setSelectedIndex(value: number | null) {
    if (this._selectedIndex !== value) {
      this._selectedIndex = value;
      this.emit("selectedIndex", value);
    }
  }

  subscribeToLoading = (callback: (value: boolean) => void) => {
    // Work around for github.com/facebook/react/issues/27670
    callback(this._isLoading);

    return this.addListener("loading", callback);
  };

  subscribeToInvalidation = (callback: () => void) => {
    // Work around for github.com/facebook/react/issues/27670
    callback();

    return this.addListener("invalidate", callback);
  };

  subscribeToSelectedIndex = (callback: (index: number | null) => void) => {
    // Work around for github.com/facebook/react/issues/27670
    callback(this._selectedIndex);

    return this.addListener("selectedIndex", callback);
  };

  async waitUntilLoaded() {
    await this._loadingWaiter.promise;
  }

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

    this.emit("invalidate");
  }

  protected updateIsLoading(isLoading: boolean): void {
    if (this._isLoading !== isLoading) {
      this._isLoading = isLoading;

      if (isLoading) {
        if (this._loadingWaiter.status === STATUS_RESOLVED) {
          this._loadingWaiter = createDeferred();
        }
      } else {
        if (this._loadingWaiter.status !== STATUS_RESOLVED) {
          this._loadingWaiter.resolve();
        }
      }
    }

    this.emit("loading", isLoading);
  }
}
