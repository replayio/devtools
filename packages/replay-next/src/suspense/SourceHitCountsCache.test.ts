import { PointRange, SourceId } from "@replayio/protocol";
import { IntervalCache } from "suspense";

import { LineHitCounts, ReplayClientInterface, SourceLocationRange } from "shared/client/types";

import { createMockReplayClient } from "../utils/testing";

const DEFAULT_SOURCE_ID = "fake-source-id";
const DEFAULT_FOCUS_RANGE = {
  begin: "0",
  end: "1234567890",
};

describe("SourceHitCountsCache", () => {
  let mockClient: { [key: string]: jest.Mock };
  let replayClient: ReplayClientInterface;

  let sourceHitCountsCache: IntervalCache<
    number,
    [replayClient: ReplayClientInterface, sourceId: SourceId, focusRange: PointRange | null],
    [number, LineHitCounts]
  >;

  beforeEach(() => {
    mockClient = createMockReplayClient() as any;
    replayClient = mockClient as any as ReplayClientInterface;

    // Clear and recreate cached data between tests.
    const module = require("./SourceHitCountsCache");
    sourceHitCountsCache = module.sourceHitCountsCache;
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
      const hitCounts_1_3 = new Map(
        await sourceHitCountsCache.readAsync(1, 3, replayClient, DEFAULT_SOURCE_ID, null)
      );
      expect(hitCounts_1_3.get(1)!.count).toBe(10);
      expect(hitCounts_1_3.get(2)!.count).toBe(20);
      expect(hitCounts_1_3.get(3)!.count).toBe(30);
      expect(mockClient.getSourceHitCounts).toHaveBeenCalledTimes(1);

      await sourceHitCountsCache.readAsync(1, 3, replayClient, DEFAULT_SOURCE_ID, null);
      expect(mockClient.getSourceHitCounts).toHaveBeenCalledTimes(1);

      // It should re-request if the visible lines change.
      const hitCounts_4_6_focus_1 = new Map(
        await sourceHitCountsCache.readAsync(4, 6, replayClient, DEFAULT_SOURCE_ID, null)
      );
      await sourceHitCountsCache.readAsync(4, 6, replayClient, DEFAULT_SOURCE_ID, null);
      expect(hitCounts_4_6_focus_1.get(4)!.count).toBe(40);
      expect(hitCounts_4_6_focus_1.get(5)!.count).toBe(50);
      expect(hitCounts_4_6_focus_1.get(6)!.count).toBe(60);
      expect(mockClient.getSourceHitCounts).toHaveBeenCalledTimes(2);

      // It should re-request if the focus range changes.
      const hitCounts_4_6_focus_2 = new Map(
        await sourceHitCountsCache.readAsync(
          4,
          6,
          replayClient,
          DEFAULT_SOURCE_ID,
          DEFAULT_FOCUS_RANGE
        )
      );
      await sourceHitCountsCache.readAsync(
        4,
        6,
        replayClient,
        DEFAULT_SOURCE_ID,
        DEFAULT_FOCUS_RANGE
      );
      expect(hitCounts_4_6_focus_2.get(4)!.count).toBe(80);
      expect(hitCounts_4_6_focus_2.get(5)!.count).toBe(100);
      expect(hitCounts_4_6_focus_2.get(6)!.count).toBe(120);
      expect(mockClient.getSourceHitCounts).toHaveBeenCalledTimes(3);
    });

    it("should not re-request lines that have already been requested if the range expands or contracts", async () => {
      const hitCounts_1_2 = new Map(
        await sourceHitCountsCache.readAsync(1, 2, replayClient, DEFAULT_SOURCE_ID, null)
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

      const hitCounts_1_4 = new Map(
        await sourceHitCountsCache.readAsync(1, 4, replayClient, DEFAULT_SOURCE_ID, null)
      );
      expect(hitCounts_1_4.get(1)!.count).toBe(10);
      expect(hitCounts_1_4.get(2)!.count).toBe(20);
      expect(hitCounts_1_4.get(3)!.count).toBe(30);
      expect(hitCounts_1_4.get(4)!.count).toBe(40);
      expect(mockClient.getSourceHitCounts).toHaveBeenCalledTimes(2);
      expect(mockClient.getSourceHitCounts).toHaveBeenCalledWith(
        "fake-source-id",
        makeLocationRange(2, 4),
        [],
        null
      );

      const hitCounts_3_4 = new Map(
        await sourceHitCountsCache.readAsync(3, 4, replayClient, DEFAULT_SOURCE_ID, null)
      );
      expect(hitCounts_3_4.get(3)!.count).toBe(30);
      expect(hitCounts_3_4.get(4)!.count).toBe(40);

      // We should have only made two requests for the above hit counts: lines 1-2 and lines 3-4
      // The rest of the data should be returned from locally cached values.
      expect(mockClient.getSourceHitCounts).toHaveBeenCalledTimes(2);
    });
  });
});
