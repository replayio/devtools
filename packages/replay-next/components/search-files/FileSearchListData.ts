import assert from "assert";

import { GenericListData } from "replay-next/components/windowing/GenericListData";
import {
  SourceSearchResult,
  assertSourceSearchResultLocation,
} from "replay-next/src/suspense/SearchCache";

export type Item = {
  isCollapsed: boolean;
  result: SourceSearchResult;
};

export class FileSearchListData extends GenericListData<Item> {
  private collapsedResultIndexToCountMap: Map<number, number> = new Map();
  private collapsedRowCount: number = 0;
  private orderedResults: SourceSearchResult[];

  constructor(orderedResults: SourceSearchResult[]) {
    super();

    this.orderedResults = orderedResults;
  }

  resultsUpdated() {
    this.collapsedResultIndexToCountMap.clear();
    this.collapsedRowCount = 0;
    this.invalidate();
  }

  toggleCollapsed(index: number, collapsed: boolean) {
    const { result } = this.getItemAtIndexImplementation(index);

    assertSourceSearchResultLocation(result);

    const resultIndex = this.orderedResults.indexOf(result);
    const prevCollapsed = this.collapsedResultIndexToCountMap.has(resultIndex);
    if (prevCollapsed === collapsed) {
      return;
    }

    if (collapsed) {
      this.collapsedResultIndexToCountMap.set(resultIndex, result.matchCount);
      this.collapsedRowCount += result.matchCount;
    } else {
      this.collapsedResultIndexToCountMap.delete(resultIndex);
      this.collapsedRowCount -= result.matchCount;
    }

    this.invalidate();
  }

  protected getItemAtIndexImplementation(index: number): Item {
    let resultIndex = -1;
    let totalCollapsedRowCount = 0;

    for (resultIndex = 0; resultIndex < this.orderedResults.length; resultIndex++) {
      if (resultIndex - totalCollapsedRowCount === index) {
        break;
      }

      // Skip over collapsed rows
      const collapsedRowCount = this.collapsedResultIndexToCountMap.get(resultIndex);
      if (collapsedRowCount != null) {
        totalCollapsedRowCount += collapsedRowCount;
        resultIndex += collapsedRowCount;
      }
    }

    const result = this.orderedResults[resultIndex];
    assert(result, `No result found at index ${index}`);

    return {
      isCollapsed: this.collapsedResultIndexToCountMap.has(resultIndex),
      result,
    };
  }

  protected getItemCountImplementation(): number {
    return this.orderedResults.length - this.collapsedRowCount;
  }
}
