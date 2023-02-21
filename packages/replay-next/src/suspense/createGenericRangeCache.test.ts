import { PointRange } from "@replayio/protocol";
import rangeArray from "lodash/range";

import { ReplayClientInterface } from "shared/client/types";

import { RangeCache, createGenericRangeCache } from "./createGenericRangeCache";

function createMockCache(mockValues?: (range: PointRange) => number[]): {
  cache: RangeCache<number>;
  requestedRanges: PointRange[];
} {
  const requestedRanges: PointRange[] = [];
  const cache = createGenericRangeCache<number>(
    async (client, range, cacheValues, cacheError) => {
      requestedRanges.push(range);
      if (mockValues) {
        try {
          cacheValues(mockValues(range));
        } catch (error) {
          cacheError(error);
        }
      }
    },
    point => `${point}`
  );
  return { cache, requestedRanges };
}

const mockClient = undefined as unknown as ReplayClientInterface;
const mockRangeFull = { begin: "0", end: "10" };
const mockRange1 = { begin: "0", end: "5" };
const mockRange2 = { begin: "5", end: "10" };
const mockValues = (range: PointRange) => rangeArray(+range.begin, +range.end);
const mockError = (range: PointRange) => {
  if (+range.begin <= 3 && +range.end >= 7) {
    throw new Error("Test");
  }
  return mockValues(range);
};

describe("createGenericRangeCache", () => {
  it("should fetch a range only once", async () => {
    const { cache, requestedRanges } = createMockCache();
    await cache.getValuesAsync(mockClient, mockRangeFull);
    await cache.getValuesAsync(mockClient, mockRangeFull);
    expect(requestedRanges).toStrictEqual([mockRangeFull]);
  });

  it("should not refetch a range if a larger range was already fetched", async () => {
    const { cache, requestedRanges } = createMockCache();
    await cache.getValuesAsync(mockClient, mockRangeFull);
    await cache.getValuesAsync(mockClient, mockRange1);
    expect(requestedRanges).toStrictEqual([mockRangeFull]);
  });

  it("should only fetch the missing part of a range", async () => {
    const { cache, requestedRanges } = createMockCache();
    await cache.getValuesAsync(mockClient, mockRange1);
    await cache.getValuesAsync(mockClient, mockRangeFull);
    expect(requestedRanges).toStrictEqual([mockRange1, mockRange2]);
  });

  it("should return cached values", async () => {
    const { cache } = createMockCache(mockValues);

    let values = await cache.getValuesAsync(mockClient, mockRangeFull);
    expect(values).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    values = await cache.getValuesAsync(mockClient, mockRangeFull);
    expect(values).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("should only return cached values in the requested range", async () => {
    const { cache } = createMockCache(mockValues);

    let values = await cache.getValuesAsync(mockClient, mockRangeFull);
    expect(values).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    values = await cache.getValuesAsync(mockClient, mockRange1);
    expect(values).toStrictEqual([0, 1, 2, 3, 4]);
  });

  it("should merge values from different ranges", async () => {
    const { cache, requestedRanges } = createMockCache(mockValues);

    let values = await cache.getValuesAsync(mockClient, mockRange1);
    expect(values).toStrictEqual([0, 1, 2, 3, 4]);

    values = await cache.getValuesAsync(mockClient, mockRange2);
    expect(values).toStrictEqual([5, 6, 7, 8, 9]);

    values = await cache.getValuesAsync(mockClient, mockRangeFull);
    expect(values).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(requestedRanges).toStrictEqual([mockRange1, mockRange2]);
  });

  it("should rethrow an error encountered while fetching", async () => {
    const { cache } = createMockCache(mockError);
    let errored = false;
    try {
      await cache.getValuesAsync(mockClient, mockRangeFull);
    } catch (error: any) {
      expect(error.message).toBe("Test");
      errored = true;
    }
    expect(errored).toBe(true);
  });

  it("should cache an error encountered while fetching", async () => {
    const { cache, requestedRanges } = createMockCache(mockError);

    try {
      await cache.getValuesAsync(mockClient, mockRangeFull);
    } catch {}

    let errored = false;
    try {
      await cache.getValuesAsync(mockClient, mockRangeFull);
    } catch (error: any) {
      expect(error.message).toBe("Test");
      errored = true;
    }
    expect(errored).toBe(true);
    expect(requestedRanges).toStrictEqual([mockRangeFull]);
  });

  it("should not try to fetch a range if a smaller one already failed", async () => {
    const { cache, requestedRanges } = createMockCache(mockError);
    const mockRange = { begin: "1", end: "9" };

    try {
      await cache.getValuesAsync(mockClient, mockRange);
    } catch {}

    let errored = false;
    try {
      await cache.getValuesAsync(mockClient, mockRangeFull);
    } catch (error: any) {
      expect(error.message).toBe("Test");
      errored = true;
    }
    expect(errored).toBe(true);
    expect(requestedRanges).toStrictEqual([mockRange]);
  });

  it("should try to fetch a range even if it's contained in one that failed", async () => {
    const { cache, requestedRanges } = createMockCache(mockError);

    try {
      await cache.getValuesAsync(mockClient, mockRangeFull);
    } catch {}

    await cache.getValuesAsync(mockClient, mockRange1);
    expect(requestedRanges).toStrictEqual([mockRangeFull, mockRange1]);
  });

  it("should merge values from different ranges even if they overlap with a failed one", async () => {
    const { cache } = createMockCache(mockValues);

    try {
      await cache.getValuesAsync(mockClient, mockRangeFull);
    } catch {}

    await cache.getValuesAsync(mockClient, mockRange1);
    await cache.getValuesAsync(mockClient, mockRange2);

    const values = await cache.getValuesAsync(mockClient, mockRangeFull);
    expect(values).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});
