type ComparisonFunction<T> = (a: T, b: T) => number;

export function findIndex<T>(
  sortedItems: T[],
  item: T,
  comparisonFunction: ComparisonFunction<T>
): number {
  let lowIndex = 0;
  let highIndex = sortedItems.length;
  while (lowIndex < highIndex) {
    let middleIndex = (lowIndex + highIndex) >>> 1;
    const currentName = sortedItems[middleIndex];
    switch (comparisonFunction(item, currentName)) {
      case 0:
        return middleIndex;
      case 1:
        lowIndex = middleIndex + 1;
        break;
      default:
        highIndex = middleIndex;
        break;
    }
  }

  return -1;
}

export function findIndexString(sortedItems: string[], item: string): number {
  return findIndex<string>(sortedItems, item, (a, b) => a.localeCompare(b));
}

export function insert<T>(
  sortedItems: T[],
  item: T,
  comparisonFunction: ComparisonFunction<T>
): void {
  let lowIndex = 0;
  let highIndex = sortedItems.length;
  while (lowIndex < highIndex) {
    let middleIndex = (lowIndex + highIndex) >>> 1;
    const currentName = sortedItems[middleIndex];
    if (comparisonFunction(item, currentName) > 0) {
      lowIndex = middleIndex + 1;
    } else {
      highIndex = middleIndex;
    }
  }

  const insertAtIndex = lowIndex;

  sortedItems.splice(insertAtIndex, 0, item);
}

export function insertString(sortedItems: string[], item: string): void {
  return insert<string>(sortedItems, item, (a, b) => a.localeCompare(b));
}
