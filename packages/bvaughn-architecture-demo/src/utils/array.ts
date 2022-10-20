type ComparisonFunction<T> = (a: T, b: T) => number;

export function insertSorted<T = string>(
  items: T[],
  item: T,
  comparisonFunction: ComparisonFunction<T>
): void {
  let lowIndex = 0;
  let highIndex = items.length;
  while (lowIndex < highIndex) {
    let middleIndex = (lowIndex + highIndex) >>> 1;
    const currentName = items[middleIndex];
    if (comparisonFunction(item, currentName) > 0) {
      lowIndex = middleIndex + 1;
    } else {
      highIndex = middleIndex;
    }
  }

  const insertAtIndex = lowIndex;

  items.splice(insertAtIndex, 0, item);
}

export function insertSortedString(items: string[], item: string): void {
  return insertSorted(items, item, (a, b) => a.localeCompare(b));
}
