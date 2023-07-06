import { TimeStampedPoint, TimeStampedPointRange } from "@replayio/protocol";

import {
  isTimeStampedPointRangeEqual,
  isTimeStampedPointRangeGreaterThan,
  isTimeStampedPointRangeLessThan,
  isTimeStampedPointRangeSubset,
} from "replay-next/src/utils/timeStampedPoints";

describe("TimeStampedPoint util", () => {
  function toTSP(time: number): TimeStampedPoint {
    return { time, point: `${time * 1000}` };
  }

  function toTSPR(beginTime: number, endTime: number): TimeStampedPointRange {
    return { begin: toTSP(beginTime), end: toTSP(endTime) };
  }

  describe("isTimeStampedPointRangeEqual", () => {
    it("should support combinations of null values", () => {
      expect(isTimeStampedPointRangeEqual(null, null)).toEqual(true);
      expect(isTimeStampedPointRangeEqual(toTSPR(1, 3), null)).toEqual(false);
      expect(isTimeStampedPointRangeEqual(null, toTSPR(1, 3))).toEqual(false);
    });

    it("should support non-null values", () => {
      expect(isTimeStampedPointRangeEqual(toTSPR(1, 3), toTSPR(1, 3))).toEqual(true);
      expect(isTimeStampedPointRangeEqual(toTSPR(1, 3), toTSPR(0, 0))).toEqual(false);
      expect(isTimeStampedPointRangeEqual(toTSPR(1, 3), toTSPR(1, 1))).toEqual(false);
      expect(isTimeStampedPointRangeEqual(toTSPR(1, 3), toTSPR(3, 3))).toEqual(false);
    });
  });

  describe("isTimeStampedPointRangeGreaterThan", () => {
    it("should work", () => {
      // Equal
      expect(isTimeStampedPointRangeGreaterThan(toTSPR(1, 3), toTSPR(1, 3))).toBe(false);

      // Less than
      expect(isTimeStampedPointRangeGreaterThan(toTSPR(4, 8), toTSPR(1, 4))).toBe(false);
      expect(isTimeStampedPointRangeGreaterThan(toTSPR(4, 8), toTSPR(3, 6))).toBe(false);
      expect(isTimeStampedPointRangeGreaterThan(toTSPR(4, 8), toTSPR(0, 3))).toBe(false);

      // Greater than
      expect(isTimeStampedPointRangeGreaterThan(toTSPR(1, 4), toTSPR(4, 8))).toBe(true);
      expect(isTimeStampedPointRangeGreaterThan(toTSPR(3, 6), toTSPR(4, 8))).toBe(true);
      expect(isTimeStampedPointRangeGreaterThan(toTSPR(0, 3), toTSPR(4, 8))).toBe(true);
      expect(isTimeStampedPointRangeGreaterThan(toTSPR(0, 3), toTSPR(0, 4))).toBe(true);

      // Ambiguous
      expect(isTimeStampedPointRangeGreaterThan(toTSPR(2, 8), toTSPR(3, 5))).toBe(false);
      expect(isTimeStampedPointRangeGreaterThan(toTSPR(4, 6), toTSPR(1, 9))).toBe(false);
    });
  });

  describe("isTimeStampedPointRangeLessThan", () => {
    it("should work", () => {
      // Equal
      expect(isTimeStampedPointRangeLessThan(toTSPR(1, 3), toTSPR(1, 3))).toBe(false);

      // Less than
      expect(isTimeStampedPointRangeLessThan(toTSPR(4, 8), toTSPR(1, 4))).toBe(true);
      expect(isTimeStampedPointRangeLessThan(toTSPR(4, 8), toTSPR(3, 6))).toBe(true);
      expect(isTimeStampedPointRangeLessThan(toTSPR(4, 8), toTSPR(0, 3))).toBe(true);
      expect(isTimeStampedPointRangeLessThan(toTSPR(4, 8), toTSPR(3, 8))).toBe(true);

      // Greater than
      expect(isTimeStampedPointRangeLessThan(toTSPR(1, 4), toTSPR(4, 8))).toBe(false);
      expect(isTimeStampedPointRangeLessThan(toTSPR(3, 6), toTSPR(4, 8))).toBe(false);
      expect(isTimeStampedPointRangeLessThan(toTSPR(0, 3), toTSPR(4, 8))).toBe(false);

      // Ambiguous
      expect(isTimeStampedPointRangeLessThan(toTSPR(2, 8), toTSPR(3, 5))).toBe(false);
      expect(isTimeStampedPointRangeLessThan(toTSPR(4, 6), toTSPR(1, 9))).toBe(false);
    });
  });

  describe("isTimeStampedPointRangeSubset", () => {
    it("should properly handle combinations of null values", () => {
      expect(isTimeStampedPointRangeSubset(null, null)).toBe(true);
      expect(isTimeStampedPointRangeSubset(null, toTSPR(1, 3))).toBe(true);
      expect(isTimeStampedPointRangeSubset(toTSPR(1, 3), null)).toBe(false);
    });

    it("should properly handle non-null ranges", () => {
      expect(isTimeStampedPointRangeSubset(toTSPR(1, 3), toTSPR(1, 3))).toBe(true);
      expect(isTimeStampedPointRangeSubset(toTSPR(1, 3), toTSPR(2, 3))).toBe(true);
      expect(isTimeStampedPointRangeSubset(toTSPR(1, 3), toTSPR(1, 2))).toBe(true);
      expect(isTimeStampedPointRangeSubset(toTSPR(1, 3), toTSPR(2, 2))).toBe(true);

      expect(isTimeStampedPointRangeSubset(toTSPR(1, 3), toTSPR(0, 3))).toBe(false);
      expect(isTimeStampedPointRangeSubset(toTSPR(1, 3), toTSPR(1, 4))).toBe(false);
      expect(isTimeStampedPointRangeSubset(toTSPR(1, 3), toTSPR(2, 4))).toBe(false);
      expect(isTimeStampedPointRangeSubset(toTSPR(1, 3), toTSPR(0, 2))).toBe(false);
      expect(isTimeStampedPointRangeSubset(toTSPR(1, 3), toTSPR(0, 4))).toBe(false);
    });
  });
});
