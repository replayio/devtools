type ComparisonFunction<T> = (a: T, b: T) => number;

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

    const delta = comparisonFunction(targetItem, sortedItems[middleIndex]);
    if (delta === 0) {
      return middleIndex;
    } else {
      let lowIndex = middleIndex;
      let highIndex = middleIndex;

      if (delta > 0) {
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

export function findIndexString(sortedItems: string[], targetItem: string): number {
  return findIndex<string>(sortedItems, targetItem, (a, b) => a.localeCompare(b));
}

export function insert<T>(
  sortedItems: T[],
  item: T,
  comparisonFunction: ComparisonFunction<T>
): T[] {
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

  const insertAtIndex = lowIndex;

  sortedItems.splice(insertAtIndex, 0, item);

  return sortedItems;
}

export function insertString(sortedItems: string[], item: string): string[] {
  return insert<string>(sortedItems, item, (a, b) => a.localeCompare(b));
}
