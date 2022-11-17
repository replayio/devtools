import { ExecutionPoint, TimeStampedPointRange } from "@replayio/protocol";

import { isRangeInRegions } from "./time";

describe("time util", () => {
  describe("isRangeInRegions", () => {
    function toTimeStampedPointRange(...tuples: ExecutionPoint[]): TimeStampedPointRange[] {
      const range: TimeStampedPointRange[] = [];
      for (let i = 0; i < tuples.length; i += 2) {
        const beginPoint = tuples[i];
        const endPoint = tuples[i + 1];
        range.push({
          begin: {
            point: beginPoint,
            time: parseInt(beginPoint, 10),
          },
          end: {
            point: endPoint,
            time: parseInt(endPoint, 10),
          },
        });
      }
      return range;
    }

    it("should accept exact matches", () => {
      expect(isRangeInRegions("0", "10", toTimeStampedPointRange("0", "10"))).toBe(true);
    });

    it("should accept subsets", () => {
      expect(isRangeInRegions("0", "1", toTimeStampedPointRange("0", "10"))).toBe(true);
      expect(isRangeInRegions("1", "9", toTimeStampedPointRange("0", "10"))).toBe(true);
      expect(isRangeInRegions("5", "10", toTimeStampedPointRange("0", "10"))).toBe(true);
    });

    it("should reject partial overlaps", () => {
      expect(isRangeInRegions("0", "5", toTimeStampedPointRange("5", "10"))).toBe(false);
      expect(isRangeInRegions("2", "7", toTimeStampedPointRange("5", "10"))).toBe(false);
      expect(isRangeInRegions("0", "15", toTimeStampedPointRange("5", "10"))).toBe(false);
      expect(isRangeInRegions("7", "12", toTimeStampedPointRange("5", "10"))).toBe(false);
    });

    it("should reject non-contiguous overlaps", () => {
      expect(isRangeInRegions("2", "5", toTimeStampedPointRange("0", "3", "4", "8"))).toBe(false);
    });
  });
});
