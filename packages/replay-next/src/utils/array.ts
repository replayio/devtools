type ComparisonFunction<T> = (a: T, b: T) => number;
type SliceCompareFunction<ItemType, TargetType> = (item: ItemType, target: TargetType) => number;

function compareBigInt(a: string, b: string): number {
  const difference = BigInt(a) - BigInt(b);
  return parseInt("" + difference);
}

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b);
}

export function find<T>(
  sortedItems: T[],
  targetItem: T,
  comparisonFunction: ComparisonFunction<T>,
  exactMatch = true
): T | null {
  const index = findIndex(sortedItems, targetItem, comparisonFunction, exactMatch);
  return index >= 0 ? sortedItems[index] : null;
}

// Note that for non-exact matches to work
// the comparison function should return more fine-grained delta values than the typical -1, 0, or 1.
export function findIndex<T>(
  sortedItems: T[],
  targetItem: T,
  comparisonFunction: ComparisonFunction<T>,
  exactMatch = true
): number {
  let lowIndex = 0;
  let highIndex = sortedItems.length - 1;
  let middleIndex = -1;

  while (lowIndex <= highIndex) {
    middleIndex = (lowIndex + highIndex) >>> 1;

    const currentItem = sortedItems[middleIndex];
    const value = comparisonFunction(targetItem, currentItem);
    if (value === 0) {
      return middleIndex;
    } else if (value > 0) {
      lowIndex = middleIndex + 1;
    } else {
      highIndex = middleIndex - 1;
    }
  }

  if (exactMatch) {
    return -1;
  } else {
    switch (sortedItems.length) {
      case 0:
        return -1;
      case 1:
        return 0;
    }

    const value = comparisonFunction(targetItem, sortedItems[middleIndex]);
    if (value === 0) {
      return middleIndex;
    } else {
      let lowIndex = middleIndex;
      let highIndex = middleIndex;

      if (value > 0) {
        highIndex = Math.min(middleIndex + 1, sortedItems.length - 1);
      } else {
        lowIndex = Math.max(0, middleIndex - 1);
      }

      return Math.abs(comparisonFunction(targetItem, sortedItems[lowIndex])) <
        Math.abs(comparisonFunction(targetItem, sortedItems[highIndex]))
        ? lowIndex
        : highIndex;
    }
  }
}

export function findIndexBigInt(
  sortedItems: string[],
  targetItem: string,
  exactMatch = true
): number {
  return findIndex<string>(sortedItems, targetItem, compareBigInt, exactMatch);
}

export function findIndexString(sortedItems: string[], targetItem: string): number {
  return findIndex<string>(sortedItems, targetItem, compareStrings);
}

export function findInsertIndex<T>(
  sortedItems: T[],
  item: T,
  comparisonFunction: ComparisonFunction<T>
): number {
  let lowIndex = 0;
  let highIndex = sortedItems.length;
  while (lowIndex < highIndex) {
    let middleIndex = (lowIndex + highIndex) >>> 1;
    const currentItem = sortedItems[middleIndex];
    if (comparisonFunction(item, currentItem) > 0) {
      lowIndex = middleIndex + 1;
    } else {
      highIndex = middleIndex;
    }
  }

  return lowIndex;
}

export function findSliceIndices<ItemType, TargetType>(
  sortedItems: ItemType[],
  beginTarget: TargetType,
  endTarget: TargetType,
  compareFunction: SliceCompareFunction<ItemType, TargetType>
): [beginIndex: number, endIndex: number] {
  let beginIndex = -1;
  let endIndex = -1;

  let lowIndex = 0;
  let highIndex = sortedItems.length - 1;

  while (lowIndex <= highIndex) {
    const middleIndex = (lowIndex + highIndex) >>> 1;
    const currentItem = sortedItems[middleIndex];
    const value = compareFunction(currentItem, beginTarget);
    if (value === 0) {
      beginIndex = middleIndex;
      break;
    } else if (value > 0) {
      if (middleIndex - 1 > lowIndex) {
        highIndex = middleIndex - 1;
      } else {
        const peekItem = sortedItems[lowIndex];
        const peekValue = compareFunction(peekItem, beginTarget);
        if (peekValue >= 0) {
          beginIndex = lowIndex;
        }
        break;
      }
    } else {
      if (middleIndex + 1 < highIndex) {
        lowIndex = middleIndex + 1;
      } else {
        const peekItem = sortedItems[highIndex];
        const peekValue = compareFunction(peekItem, beginTarget);
        if (peekValue >= 0) {
          beginIndex = highIndex;
        }
        break;
      }
    }
  }

  if (beginIndex < 0) {
    return [-1, -1];
  }

  lowIndex = beginIndex;
  highIndex = sortedItems.length - 1;

  while (lowIndex <= highIndex) {
    const middleIndex = (lowIndex + highIndex) >>> 1;
    const currentItem = sortedItems[middleIndex];
    const value = compareFunction(currentItem, endTarget);
    if (value === 0) {
      endIndex = middleIndex;
      break;
    } else if (value > 0) {
      if (middleIndex - 1 > lowIndex) {
        highIndex = middleIndex - 1;
      } else {
        const peekItem = sortedItems[lowIndex];
        const peekValue = compareFunction(peekItem, endTarget);
        if (peekValue <= 0) {
          endIndex = lowIndex;
        }
        break;
      }
    } else {
      if (middleIndex + 1 < highIndex) {
        lowIndex = middleIndex + 1;
      } else {
        const peekItem = sortedItems[highIndex];
        const peekValue = compareFunction(peekItem, endTarget);
        if (peekValue <= 0) {
          endIndex = highIndex;
        }
        break;
      }
    }
  }

  return [beginIndex, endIndex];
}

export function insert<T>(
  sortedItems: T[],
  item: T,
  comparisonFunction: ComparisonFunction<T>
): T[] {
  const insertAtIndex = findInsertIndex(sortedItems, item, comparisonFunction);

  sortedItems.splice(insertAtIndex, 0, item);

  return sortedItems;
}

export function insertString(sortedItems: string[], item: string): string[] {
  return insert<string>(sortedItems, item, (a, b) => a.localeCompare(b));
}

export function slice<ItemType, TargetType>(
  sortedItems: ItemType[],
  beginTarget: TargetType,
  endTarget: TargetType,
  compareFunction: SliceCompareFunction<ItemType, TargetType>
): ItemType[] {
  const [beginIndex, endIndex] = findSliceIndices(
    sortedItems,
    beginTarget,
    endTarget,
    compareFunction
  );

  if (beginIndex < 0 || endIndex < 0) {
    return [];
  }

  return sortedItems.slice(beginIndex, endIndex + 1);
}
