import { ExecutionPoint, TimeStampedPointRange } from "@replayio/protocol";

import { isRangeInRegions } from "./time";

describe("time util", () => {
  describe("isRangeInRegions", () => {
    function createRange(
      beginPoint: ExecutionPoint,
      beginTime: number,
      endPoint: ExecutionPoint,
      endTime: number
    ): TimeStampedPointRange {
      return {
        begin: {
          point: beginPoint,
          time: beginTime,
        },
        end: {
          point: endPoint,
          time: endTime,
        },
      };
    }

    function quadruplesToRanges(...quadruples: any[]): TimeStampedPointRange[] {
      const ranges: TimeStampedPointRange[] = [];
      for (let i = 0; i < quadruples.length; i += 2) {
        ranges.push(
          createRange(quadruples[i], quadruples[i + 1], quadruples[i + 2], quadruples[i + 3])
        );
      }
      return ranges;
    }

    function tuplesToRanges(...tuples: any[]): TimeStampedPointRange[] {
      const ranges: TimeStampedPointRange[] = [];
      for (let i = 0; i < tuples.length; i += 2) {
        ranges.push(tupleToRange(tuples[i], tuples[i + 1]));
      }
      return ranges;
    }

    function tupleToRange(
      beginPoint: ExecutionPoint,
      endPoint: ExecutionPoint
    ): TimeStampedPointRange {
      return createRange(beginPoint, parseInt(beginPoint, 10), endPoint, parseInt(endPoint, 10));
    }

    it("should accept exact matches", () => {
      expect(isRangeInRegions(tupleToRange("0", "10"), tuplesToRanges("0", "10"))).toBe(true);
    });

    it("should accept subsets", () => {
      expect(isRangeInRegions(tupleToRange("0", "1"), tuplesToRanges("0", "10"))).toBe(true);
      expect(isRangeInRegions(tupleToRange("1", "9"), tuplesToRanges("0", "10"))).toBe(true);
      expect(isRangeInRegions(tupleToRange("5", "10"), tuplesToRanges("0", "10"))).toBe(true);
    });

    it("should reject partial overlaps", () => {
      expect(isRangeInRegions(tupleToRange("0", "5"), tuplesToRanges("5", "10"))).toBe(false);
      expect(isRangeInRegions(tupleToRange("2", "7"), tuplesToRanges("5", "10"))).toBe(false);
      expect(isRangeInRegions(tupleToRange("0", "15"), tuplesToRanges("5", "10"))).toBe(false);
      expect(isRangeInRegions(tupleToRange("7", "12"), tuplesToRanges("5", "10"))).toBe(false);
    });

    it("should reject non-contiguous overlaps", () => {
      expect(isRangeInRegions(tupleToRange("2", "5"), tuplesToRanges("0", "3", "4", "8"))).toBe(
        false
      );
    });

    // Imitate scenario where in-memory time-to-points mapping is too coarse
    // to correctly differentiate between different time ranges.
    it("should reject ranges where time is outside even if points are inside", () => {
      expect(
        isRangeInRegions(createRange("5", 2, "10", 10), quadruplesToRanges("5", 5, "10", 10))
      ).toBe(false);
      expect(
        isRangeInRegions(createRange("5", 2, "10", 15), quadruplesToRanges("0", 0, "10", 10))
      ).toBe(false);
    });
  });
});
