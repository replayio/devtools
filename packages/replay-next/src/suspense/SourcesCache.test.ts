import { PointRange, SourceId, TimeStampedPointRange } from "@replayio/protocol";

import {
  LineNumberToHitCountMap,
  ReplayClientInterface,
  SourceLocationRange,
} from "shared/client/types";

import { createMockReplayClient } from "../utils/testing";

const DEFAULT_SOURCE_ID = "fake-source-id";
const DEFAULT_FOCUS_RANGE = {
  begin: "0",
  end: "1234567890",
};

describe("SourcesCache", () => {
  let mockClient: { [key: string]: jest.Mock };
  let replayClient: ReplayClientInterface;

  let getCachedMinMaxSourceHitCounts: (
    sourceId: SourceId,
    focusRange: TimeStampedPointRange | PointRange | null
  ) => LineNumberToHitCountMap;

  let getSourceHitCountsSuspense: (
    replayClient: ReplayClientInterface,
    sourceId: SourceId,
    locationRange: SourceLocationRange,
    focusRange: TimeStampedPointRange | PointRange | null
  ) => LineNumberToHitCountMap;

  beforeEach(() => {
    mockClient = createMockReplayClient() as any;
    replayClient = mockClient as any as ReplayClientInterface;

    // Clear and recreate cached data between tests.
    const module = require("./SourcesCache");
    getCachedMinMaxSourceHitCounts = module.getCachedMinMaxSourceHitCounts;
    getSourceHitCountsSuspense = module.getSourceHitCountsSuspense;
  });

  afterEach(() => {
    // Reset in-memory caches between test runs.
    jest.resetModules();
  });

  describe("getSourceHitCounts", () => {
    function makeLocationRange(
      startLineNumber: number,
      endLineNumber: number
    ): SourceLocationRange {
      return {
        start: {
          line: startLineNumber,
          column: 0,
        },
        end: {
          line: endLineNumber,
          column: Number.MAX_SAFE_INTEGER,
        },
      };
    }

    async function getSourceHitCountsHelper(
      sourceId: SourceId,
      locationRange: SourceLocationRange,
      focusRange: TimeStampedPointRange | PointRange | null = null
    ): Promise<LineNumberToHitCountMap> {
      try {
        return getSourceHitCountsSuspense(replayClient, sourceId, locationRange, focusRange);
      } catch (promise) {
        await promise;

        return getSourceHitCountsSuspense(replayClient, sourceId, locationRange, focusRange);
      }
    }

    beforeEach(() => {
      mockClient.getSourceHitCounts.mockImplementation((_, locationRange, __, focusRange) => {
        const hitCounts = new Map();
        for (
          let lineNumber = locationRange.start.line;
          lineNumber <= locationRange.end.line;
          lineNumber++
        ) {
          const count = focusRange != null ? lineNumber * 20 : lineNumber * 10;
          hitCounts.set(lineNumber, { count });
        }
        return Promise.resolve(hitCounts);
      });
    });

    it("should fetch and cache hit counts for a set of lines and a focus range", async () => {
      const hitCounts_1_3 = await getSourceHitCountsHelper(
        DEFAULT_SOURCE_ID,
        makeLocationRange(1, 3)
      );
      expect(hitCounts_1_3.get(1)!.count).toBe(10);
      expect(hitCounts_1_3.get(2)!.count).toBe(20);
      expect(hitCounts_1_3.get(3)!.count).toBe(30);
      expect(mockClient.getSourceHitCounts).toHaveBeenCalledTimes(1);

      await getSourceHitCountsHelper(DEFAULT_SOURCE_ID, makeLocationRange(1, 3));
      expect(mockClient.getSourceHitCounts).toHaveBeenCalledTimes(1);

      // Check that we've updated cached min/max hit counts.
      expect(getCachedMinMaxSourceHitCounts(DEFAULT_SOURCE_ID, null)).toEqual([10, 30]);

      // It should re-request if the visible lines change.
      const hitCounts_4_6_focus_1 = await getSourceHitCountsHelper(
        DEFAULT_SOURCE_ID,
        makeLocationRange(4, 6)
      );
      await getSourceHitCountsHelper(DEFAULT_SOURCE_ID, makeLocationRange(4, 6));
      expect(hitCounts_4_6_focus_1.get(4)!.count).toBe(40);
      expect(hitCounts_4_6_focus_1.get(5)!.count).toBe(50);
      expect(hitCounts_4_6_focus_1.get(6)!.count).toBe(60);
      expect(mockClient.getSourceHitCounts).toHaveBeenCalledTimes(2);

      // Check that we've updated cached min/max hit counts.
      expect(getCachedMinMaxSourceHitCounts(DEFAULT_SOURCE_ID, null)).toEqual([10, 60]);

      // It should re-request if the focus range changes.
      const hitCounts_4_6_focus_2 = await getSourceHitCountsHelper(
        DEFAULT_SOURCE_ID,
        makeLocationRange(4, 6),
        DEFAULT_FOCUS_RANGE
      );
      await getSourceHitCountsHelper(
        DEFAULT_SOURCE_ID,
        makeLocationRange(4, 6),
        DEFAULT_FOCUS_RANGE
      );
      expect(hitCounts_4_6_focus_2.get(4)!.count).toBe(80);
      expect(hitCounts_4_6_focus_2.get(5)!.count).toBe(100);
      expect(hitCounts_4_6_focus_2.get(6)!.count).toBe(120);
      expect(mockClient.getSourceHitCounts).toHaveBeenCalledTimes(3);

      // Check that we've updated cached min/max hit counts.
      expect(getCachedMinMaxSourceHitCounts(DEFAULT_SOURCE_ID, null)).toEqual([10, 60]);
      expect(getCachedMinMaxSourceHitCounts(DEFAULT_SOURCE_ID, DEFAULT_FOCUS_RANGE)).toEqual([
        80, 120,
      ]);
    });

    it("should not re-request lines that have already been requested if the range expands or contracts", async () => {
      const hitCounts_1_2 = await getSourceHitCountsHelper(
        DEFAULT_SOURCE_ID,
        makeLocationRange(1, 2)
      );
      expect(hitCounts_1_2.get(1)!.count).toBe(10);
      expect(hitCounts_1_2.get(2)!.count).toBe(20);
      expect(mockClient.getSourceHitCounts).toHaveBeenCalledTimes(1);
      expect(mockClient.getSourceHitCounts).toHaveBeenCalledWith(
        "fake-source-id",
        makeLocationRange(1, 2),
        [],
        null
      );

      // Check that we've updated cached min/max hit counts.
      expect(getCachedMinMaxSourceHitCounts(DEFAULT_SOURCE_ID, null)).toEqual([10, 20]);

      const hitCounts_1_4 = await getSourceHitCountsHelper(
        DEFAULT_SOURCE_ID,
        makeLocationRange(1, 4)
      );
      expect(hitCounts_1_4.get(1)!.count).toBe(10);
      expect(hitCounts_1_4.get(2)!.count).toBe(20);
      expect(hitCounts_1_4.get(3)!.count).toBe(30);
      expect(hitCounts_1_4.get(4)!.count).toBe(40);
      expect(mockClient.getSourceHitCounts).toHaveBeenCalledTimes(2);
      expect(mockClient.getSourceHitCounts).toHaveBeenCalledWith(
        "fake-source-id",
        makeLocationRange(3, 4),
        [],
        null
      );

      // Check that we've updated cached min/max hit counts.
      expect(getCachedMinMaxSourceHitCounts(DEFAULT_SOURCE_ID, null)).toEqual([10, 40]);

      const hitCounts_3_4 = await getSourceHitCountsHelper(
        DEFAULT_SOURCE_ID,
        makeLocationRange(3, 4)
      );
      expect(hitCounts_3_4.get(3)!.count).toBe(30);
      expect(hitCounts_3_4.get(4)!.count).toBe(40);

      // We should have only made two requests for the above hit counts: lines 1-2 and lines 3-4
      // The rest of the data should be returned from locally cached values.
      expect(mockClient.getSourceHitCounts).toHaveBeenCalledTimes(2);
    });
  });
});
