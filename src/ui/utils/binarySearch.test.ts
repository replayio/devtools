import {
  binarySearch,
  closerEntry,
  insertEntrySorted,
  mostRecentContainedEntry,
  mostRecentEntry,
  mostRecentIndex,
  nextEntry,
} from "protocol/utils";

const t = (t: number) => ({ time: t });

// times 0 -> 9
const times = new Array(10).fill(undefined).map((_, i) => t(i));

describe("binarySearch", () => {
  it("returns the index the item fits into", () => {
    let target = 1;
    expect(binarySearch(0, times.length, index => target - times[index].time)).toBe(1);
    target = 5;
    expect(binarySearch(0, times.length, index => target - times[index].time)).toBe(5);
    target = 9;
    expect(binarySearch(0, times.length, index => target - times[index].time)).toBe(9);
    target = Infinity;
    expect(binarySearch(0, times.length, index => target - times[index].time)).toBe(9);
    target = 0;
    expect(binarySearch(0, times.length, index => target - times[index].time)).toBe(0);
    target = -Infinity;
    expect(binarySearch(0, times.length, index => target - times[index].time)).toBe(0);
  });
});

describe("mostRecentIndex", () => {
  it("returns the index just before where this would go in the array", () => {
    expect(mostRecentIndex(times, 5)).toBe(5);

    // upper bound
    expect(mostRecentIndex(times, 9)).toBe(9);
    expect(mostRecentIndex(times, 10)).toBe(9);
    expect(mostRecentIndex(times, Infinity)).toBe(9);

    // lower bound
    expect(mostRecentIndex(times, 0)).toBe(0);
    expect(mostRecentIndex(times, -1)).toBe(undefined);
    expect(mostRecentIndex(times, -Infinity)).toBe(undefined);
  });
});

describe("mostRecentEntry", () => {
  it("returns the entry just before this one", () => {
    expect(mostRecentEntry(times, 5)).toEqual(t(5));

    // upper bound
    expect(mostRecentEntry(times, 9)).toEqual(t(9));
    expect(mostRecentEntry(times, 10)).toEqual(t(9));
    expect(mostRecentEntry(times, Infinity)).toEqual(t(9));

    // lower bound
    expect(mostRecentEntry(times, 0)).toEqual(t(0));
    expect(mostRecentEntry(times, -1)).toBe(null);
    expect(mostRecentEntry(times, -Infinity)).toBe(null);
  });
});

describe("mostRecentContainedEntry", () => {
  it("returns the entry just before this one, as long as this is within the range of known values", () => {
    expect(mostRecentContainedEntry(times, 5)).toEqual(t(5));

    // upper bound
    expect(mostRecentContainedEntry(times, 9)).toEqual(t(9));

    // beyond end
    expect(mostRecentContainedEntry(times, 10)).toEqual(null);
    expect(mostRecentContainedEntry(times, Infinity)).toEqual(null);

    // lower bound
    expect(mostRecentContainedEntry(times, 0)).toEqual(t(0));
    expect(mostRecentContainedEntry(times, -1)).toBe(null);
    expect(mostRecentContainedEntry(times, -Infinity)).toBe(null);
  });
});

describe("nextEntry", () => {
  it("returns the entry right after this one", () => {
    expect(nextEntry(times, 5)).toEqual(t(6));

    // upper bound
    expect(nextEntry(times, 8)).toEqual(t(9));
    expect(nextEntry(times, 9)).toEqual(null);
    expect(nextEntry(times, 9.5)).toBe(null);
    expect(nextEntry(times, 10)).toBe(null);
    expect(nextEntry(times, Infinity)).toBe(null);

    // lower bound
    expect(nextEntry(times, 0)).toEqual(t(1));
    expect(nextEntry(times, -1)).toEqual(t(0));
    expect(nextEntry(times, -Infinity)).toEqual(t(0));
  });
});

describe("closerEntry", () => {
  it("returns the closer of the two", () => {
    expect(closerEntry(5, t(4), t(7))).toEqual(t(4));
  });

  it("returns the larger of the two when equidistant", () => {
    expect(closerEntry(5, t(4), t(6))).toEqual(t(6));
  });

  it("returns itself when one it falls on one of the options", () => {
    expect(closerEntry(5, t(4), t(4))).toEqual(t(4));
  });

  it("when one is absent it returns the other", () => {
    expect(closerEntry(5, null, t(6))).toEqual(t(6));
    expect(closerEntry(5, t(4), null)).toEqual(t(4));
  });
});

describe("insertEntrySorted", () => {
  it("inserts at the right place", () => {
    const times = [t(1), t(2), t(3), t(5)];

    insertEntrySorted(times, t(4));

    expect(times).toEqual([t(1), t(2), t(3), t(4), t(5)]);
  });

  it("returns the larger of the two when equidistant", () => {
    const times = [t(1), t(2), t(3), t(4)];

    insertEntrySorted(times, t(5));

    expect(times).toEqual([t(1), t(2), t(3), t(4), t(5)]);
  });

  it("returns the larger of the two when equidistant", () => {
    const times = [t(2), t(3), t(4), t(5)];

    insertEntrySorted(times, t(1));

    expect(times).toEqual([t(1), t(2), t(3), t(4), t(5)]);
  });
});
