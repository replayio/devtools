import { ExecutionPoint, TimeStampedPoint } from "@replayio/protocol";

import { findClosestHitPoint, findHitPoint, findHitPointAfter, findHitPointBefore } from "./points";

function toTSP(time: number): TimeStampedPoint {
  return { time, point: `${time * 1000}` };
}

describe("utils/points", () => {
  let hitPoints: TimeStampedPoint[] = [];
  beforeEach(() => {
    hitPoints = [];
    hitPoints.push(toTSP(1));
    hitPoints.push(toTSP(4));
    hitPoints.push(toTSP(6));
  });

  describe("findClosestHitPoint", () => {
    function verifyIndex(executionPoint: ExecutionPoint, expectedIndex: number) {
      const match = findClosestHitPoint(hitPoints, { point: executionPoint, time: 0 });
      expect(match).toHaveLength(2);
      expect(match[1]).toBe(expectedIndex);
    }

    it("should find an exact match", () => {
      verifyIndex("1000", 0);
      verifyIndex("4000", 1);
      verifyIndex("6000", 2);
    });

    it("should find the closest point if there is not exact match", () => {
      verifyIndex("2000", 0);
      verifyIndex("3000", 1);

      // Test a point that's exactly in the middle
      verifyIndex("5000", 1);
    });

    it("handle an empty set of points", () => {
      hitPoints.splice(0);

      verifyIndex("1000", -1);
    });
  });

  describe("findHitPoint", () => {
    function verifyIndex(
      executionPoint: ExecutionPoint,
      exactMatch: boolean,
      expectedIndex: number
    ) {
      const match = findHitPoint(hitPoints, { point: executionPoint, time: 0 }, exactMatch);
      expect(match).toHaveLength(2);
      expect(match[1]).toBe(expectedIndex);
    }

    describe("exactMatch: true", () => {
      it("should find an exact match", () => {
        verifyIndex("1000", true, 0);
        verifyIndex("4000", true, 1);
        verifyIndex("6000", true, 2);
      });

      it("should return -1 if there is not an exact match", () => {
        verifyIndex("2000", true, -1);
        verifyIndex("3000", true, -1);
      });
    });

    describe("exactMatch: false", () => {
      it("should find an exact match", () => {
        verifyIndex("1000", false, 0);
        verifyIndex("4000", false, 1);
        verifyIndex("6000", false, 2);
      });

      it("should find the closest point if there is not exact match", () => {
        verifyIndex("2000", false, 0);
        verifyIndex("3000", false, 1);

        // Test a point that's exactly in the middle
        verifyIndex("5000", false, 1);
      });

      it("handle an empty set of points", () => {
        hitPoints.splice(0);

        verifyIndex("1000", false, -1);
      });
    });
  });

  describe("findHitPointAfter", () => {
    function verifyIndex(executionPoint: ExecutionPoint, expectedIndex: number) {
      const match = findHitPointAfter(hitPoints, { point: executionPoint, time: 0 });
      expect(match).toHaveLength(2);
      expect(match[1]).toBe(expectedIndex);
    }

    it("should correctly handle points within the hit points collection", () => {
      verifyIndex("1000", 1);
      verifyIndex("1001", 1);
      verifyIndex("3999", 1);

      verifyIndex("4000", 2);
      verifyIndex("4001", 2);
      verifyIndex("5999", 2);
    });

    it("should correctly handle points before and after the last point", () => {
      verifyIndex("0", 0);
      verifyIndex("999", 0);

      verifyIndex("6000", -1);
      verifyIndex("6001", -1);
    });
  });

  // 0:1000, 1:4000, 2:6000
  describe("findHitPointBefore", () => {
    function verifyIndex(executionPoint: ExecutionPoint, expectedIndex: number) {
      const match = findHitPointBefore(hitPoints, { point: executionPoint, time: 0 });
      expect(match).toHaveLength(2);
      expect(match[1]).toBe(expectedIndex);
    }

    it("should correctly handle points within the hit points collection", () => {
      verifyIndex("1001", 0);
      verifyIndex("3999", 0);
      verifyIndex("4000", 0);

      verifyIndex("4001", 1);
      verifyIndex("5999", 1);
      verifyIndex("6000", 1);
    });

    it("should correctly handle points before and after the last point", () => {
      verifyIndex("0", -1);
      verifyIndex("1000", -1);

      verifyIndex("6001", 2);
    });
  });

  describe("findPointForLocation", () => {
    // TODO
  });

  describe("findPointsForLocation", () => {
    // TODO
  });
});
