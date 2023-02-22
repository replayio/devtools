import { Range, getMissingRanges, isInRange, mergeRanges, rangeContains } from "./range-list";

describe("RangeLists", () => {
  it("should be merged correctly", () => {
    const range = { begin: BigInt(0), end: BigInt(14) };
    const rangeList1: Range[] = [
      { begin: BigInt(3), end: BigInt(6) },
      { begin: BigInt(10), end: BigInt(11) },
    ];
    for (const rangeList2 of allRangeLists(2, range)) {
      const mergedRangeList1 = mergeRanges(rangeList1, rangeList2);
      const mergedRangeList2 = mergeRanges(rangeList2, rangeList1);
      expect(checkRangeList(mergedRangeList1)).toBe(true);
      expect(checkRangeList(mergedRangeList2)).toBe(true);
      for (let i = range.begin; i < range.end; i++) {
        const expected = isInRangeList(i, rangeList1) || isInRangeList(i, rangeList2);
        const actual1 = isInRangeList(i, mergedRangeList1);
        expect(actual1).toBe(expected);
        const actual2 = isInRangeList(i, mergedRangeList2);
        expect(actual2).toBe(expected);
      }
    }
  });

  it("should be subtracted correctly", () => {
    const containerRange = { begin: BigInt(0), end: BigInt(9) };
    const range = { begin: BigInt(2), end: BigInt(7) };
    for (const rangeList of allRangeLists(2, containerRange)) {
      const missingRanges = getMissingRanges(range, rangeList);
      expect(checkRangeList(missingRanges)).toBe(true);
      expect(missingRanges.every(missingRange => rangeContains(range, missingRange)));
      for (let i = range.begin; i < range.end; i++) {
        const expected = !isInRangeList(i, rangeList);
        const actual = isInRangeList(i, missingRanges);
        expect(actual).toBe(expected);
      }
    }
  });
});

// Generate all possible RangeLists containing `size` ranges within the given `container` range
function* allRangeLists(size: number, container: Range): IterableIterator<Range[]> {
  for (let begin = container.begin; begin < container.end - BigInt(size * 2 - 2); begin++) {
    for (let end = begin + BigInt(1); end < container.end - BigInt(size * 2 - 3); end++) {
      if (size === 1) {
        yield [{ begin, end }];
      } else {
        for (const rangeList of allRangeLists(size - 1, {
          begin: end + BigInt(1),
          end: container.end,
        })) {
          yield [{ begin, end }, ...rangeList];
        }
      }
    }
  }
}

function isInRangeList(b: bigint, rangeList: Range[]) {
  return rangeList.some(range => isInRange(b, range));
}

// check that rangeList[0].begin < rangeList[0].end < rangeList[1].begin < ...
function checkRangeList(rangeList: Range[]) {
  for (let i = 0; i < rangeList.length; i++) {
    if (rangeList[i].begin >= rangeList[i].end) {
      return false;
    }
    if (i + 1 < rangeList.length) {
      if (rangeList[i].end >= rangeList[i + 1].begin) {
        return false;
      }
    }
  }
  return true;
}
