import {
  ExecutionPoint,
  Location,
  getPointsBoundingTimeResult as PointsBoundingTime,
  TimeStampedPoint,
  TimeStampedPointRange,
} from "@replayio/protocol";

import { HitPointsAndStatusTuple, ReplayClientInterface } from "shared/client/types";
import { ProtocolError, commandError } from "shared/utils/error";

import { createMockReplayClient } from "../utils/testing";

describe("PointsCache", () => {
  let mockClient: { [key: string]: jest.Mock };
  let replayClient: ReplayClientInterface;

  let getCachedHitPointsForLocation: (
    location: Location,
    condition: string | null,
    focusRange: TimeStampedPointRange | null
  ) => HitPointsAndStatusTuple;
  let getClosestPointForTimeSuspense: (
    client: ReplayClientInterface,
    time: number
  ) => ExecutionPoint;
  let getHitPointsForLocationSuspense: (
    client: ReplayClientInterface,
    location: Location,
    condition: string | null,
    focusRange: TimeStampedPointRange | null
  ) => HitPointsAndStatusTuple;
  let imperativelyGetClosestPointForTime: (
    client: ReplayClientInterface,
    time: number
  ) => Promise<ExecutionPoint>;
  let preCacheExecutionPointForTime: (timeStampedPoint: TimeStampedPoint) => void;

  beforeEach(() => {
    mockClient = createMockReplayClient() as any;
    replayClient = mockClient as any as ReplayClientInterface;

    // Clear and recreate cached data between tests.
    const module = require("./ExecutionPointsCache");
    getCachedHitPointsForLocation = module.getCachedHitPointsForLocation;
    getClosestPointForTimeSuspense = module.getClosestPointForTimeSuspense;
    getHitPointsForLocationSuspense = module.getHitPointsForLocationSuspense;
    imperativelyGetClosestPointForTime = module.imperativelyGetClosestPointForTime;
    preCacheExecutionPointForTime = module.preCacheExecutionPointForTime;
  });

  afterEach(() => {
    // Reset in-memory caches between test runs.
    jest.resetModules();
  });

  describe("getClosestPointForTime", () => {
    async function getClosestPointForTimeHelper(time: number): Promise<ExecutionPoint> {
      try {
        return getClosestPointForTimeSuspense(replayClient, time);
      } catch (promise) {
        await promise;

        return getClosestPointForTimeSuspense(replayClient, time);
      }
    }

    it("should return the point that is closest to the request time", async () => {
      mockClient.getPointsBoundingTime.mockReturnValue({
        before: { time: 25, point: "25" },
        after: { time: 100, point: "100" },
      });

      let point = await getClosestPointForTimeHelper(25);
      expect(point).toBe("25");
      point = await getClosestPointForTimeHelper(50);
      expect(point).toBe("25");
      point = await getClosestPointForTimeHelper(100);
      expect(point).toBe("100");
    });

    it("should not re-request times within ranges that have been requested previously", async () => {
      mockClient.getPointsBoundingTime.mockReturnValue({
        before: { time: 20, point: "20" },
        after: { time: 30, point: "30" },
      });
      await expect(await getClosestPointForTimeHelper(22)).toBe("20");
      expect(mockClient.getPointsBoundingTime).toHaveBeenCalledTimes(1);

      mockClient.getPointsBoundingTime.mockReturnValue({
        before: { time: 31, point: "31" },
        after: { time: 34, point: "34" },
      });
      await expect(await getClosestPointForTimeHelper(32)).toBe("31");
      expect(mockClient.getPointsBoundingTime).toHaveBeenCalledTimes(2);

      mockClient.getPointsBoundingTime.mockReturnValue({
        before: { time: 70, point: "70" },
        after: { time: 80, point: "80" },
      });
      await expect(await getClosestPointForTimeHelper(78)).toBe("80");
      expect(mockClient.getPointsBoundingTime).toHaveBeenCalledTimes(3);

      mockClient.getPointsBoundingTime.mockReturnValue({
        before: { time: 50, point: "50" },
        after: { time: 60, point: "60" },
      });
      await expect(await getClosestPointForTimeHelper(50)).toBe("50");
      expect(mockClient.getPointsBoundingTime).toHaveBeenCalledTimes(4);

      // So long as we stay within the pre-cached bounds at this point, no new requests should be made.
      // This test covers our binary array insert and search logic.
      await expect(await getClosestPointForTimeHelper(20)).toBe("20");
      await expect(await getClosestPointForTimeHelper(26)).toBe("30");
      await expect(await getClosestPointForTimeHelper(30)).toBe("30");
      await expect(await getClosestPointForTimeHelper(31)).toBe("31");
      await expect(await getClosestPointForTimeHelper(34)).toBe("34");
      await expect(await getClosestPointForTimeHelper(50)).toBe("50");
      await expect(await getClosestPointForTimeHelper(52)).toBe("50");
      await expect(await getClosestPointForTimeHelper(60)).toBe("60");
      await expect(await getClosestPointForTimeHelper(70)).toBe("70");
      await expect(await getClosestPointForTimeHelper(72)).toBe("70");
      await expect(await getClosestPointForTimeHelper(80)).toBe("80");
      expect(mockClient.getPointsBoundingTime).toHaveBeenCalledTimes(4);
    });
  });

  describe("getHitPointsForLocation", () => {
    async function getHitPointsForLocationHelper(
      location: Location,
      conditional: string | null,
      focusRange: TimeStampedPointRange | null
    ): Promise<HitPointsAndStatusTuple> {
      try {
        return getHitPointsForLocationSuspense(replayClient, location, conditional, focusRange);
      } catch (promise) {
        await promise;

        return getHitPointsForLocationSuspense(replayClient, location, conditional, focusRange);
      }
    }

    let mockLocation: Location = {
      line: 0,
      column: 0,
      sourceId: "source",
    };

    it("should cache results to avoid requesting more than once", async () => {
      const tsp = { time: 0, point: "0" };
      mockClient.getHitPointsForLocation.mockReturnValue([[tsp], "complete"]);

      await getHitPointsForLocationHelper(mockLocation, null, null);
      await getHitPointsForLocationHelper(mockLocation, null, null);

      expect(mockClient.getHitPointsForLocation).toBeCalledTimes(1);

      // Verify that the cached getter returns the same thing without re-querying the client.
      const [cachedTimeStampedPoint, cachedStatus] = getCachedHitPointsForLocation(
        mockLocation,
        null,
        null
      );
      expect(cachedTimeStampedPoint).toEqual([tsp]);
      expect(cachedStatus).toEqual("complete");
      expect(mockClient.getHitPointsForLocation).toBeCalledTimes(1);
    });

    it("should re-request hit points for a location if the conditional changes", async () => {
      mockClient.getHitPointsForLocation.mockReturnValue([[], "complete"]);

      await getHitPointsForLocationHelper(mockLocation, null, null);
      expect(mockClient.getHitPointsForLocation).toBeCalledTimes(1);
      await getHitPointsForLocationHelper(mockLocation, "true", null);
      expect(mockClient.getHitPointsForLocation).toBeCalledTimes(2);
      await getHitPointsForLocationHelper(mockLocation, "123", null);
      expect(mockClient.getHitPointsForLocation).toBeCalledTimes(3);

      // But these values should be cached for future requests.
      await getHitPointsForLocationHelper(mockLocation, null, null);
      await getHitPointsForLocationHelper(mockLocation, "true", null);
      await getHitPointsForLocationHelper(mockLocation, "123", null);
      expect(mockClient.getHitPointsForLocation).toBeCalledTimes(3);
    });

    it("should re-request hit points for a location if the focus region changes", async () => {
      mockClient.getHitPointsForLocation.mockReturnValue([[], "complete"]);

      await getHitPointsForLocationHelper(mockLocation, null, null);
      await getHitPointsForLocationHelper(mockLocation, null, {
        begin: { time: 0, point: "0" },
        end: { time: 100, point: "100" },
      });
      await getHitPointsForLocationHelper(mockLocation, null, {
        begin: { time: 10, point: "10" },
        end: { time: 120, point: "120" },
      });
      expect(mockClient.getHitPointsForLocation).toBeCalledTimes(3);

      // But these values should be cached for future requests.
      await getHitPointsForLocationHelper(mockLocation, null, null);
      await getHitPointsForLocationHelper(mockLocation, null, {
        begin: { time: 0, point: "0" },
        end: { time: 100, point: "100" },
      });
      await getHitPointsForLocationHelper(mockLocation, null, {
        begin: { time: 10, point: "10" },
        end: { time: 120, point: "120" },
      });
      expect(mockClient.getHitPointsForLocation).toBeCalledTimes(3);
    });
  });

  describe("imperativelyGetClosestPointForTime", () => {
    it("should return cached values for times that fall within previously requested point ranges", async () => {
      mockClient.getPointsBoundingTime.mockReturnValue({
        before: { time: 30, point: "30" },
        after: { time: 40, point: "40" },
      });
      await imperativelyGetClosestPointForTime(replayClient, 38);

      mockClient.getPointsBoundingTime.mockReturnValue({
        before: { time: 10, point: "10" },
        after: { time: 20, point: "20" },
      });
      await imperativelyGetClosestPointForTime(replayClient, 12);

      expect(mockClient.getPointsBoundingTime).toHaveBeenCalledTimes(2);

      await expect(await imperativelyGetClosestPointForTime(replayClient, 10)).toBe("10");
      await expect(await imperativelyGetClosestPointForTime(replayClient, 14)).toBe("10");
      await expect(await imperativelyGetClosestPointForTime(replayClient, 20)).toBe("20");
      await expect(await imperativelyGetClosestPointForTime(replayClient, 30)).toBe("30");
      await expect(await imperativelyGetClosestPointForTime(replayClient, 36)).toBe("40");
      await expect(await imperativelyGetClosestPointForTime(replayClient, 40)).toBe("40");
      expect(mockClient.getPointsBoundingTime).toHaveBeenCalledTimes(2);
    });

    it("should ask the backend for times without pre-cached matches", async () => {
      mockClient.getPointsBoundingTime.mockReturnValue({
        before: { time: 10, point: "10" },
        after: { time: 20, point: "20" },
      });
      await expect(await imperativelyGetClosestPointForTime(replayClient, 12)).toBe("10");
      expect(mockClient.getPointsBoundingTime).toHaveBeenCalledTimes(1);

      mockClient.getPointsBoundingTime.mockReturnValue({
        before: { time: 21, point: "21" },
        after: { time: 24, point: "24" },
      });
      await expect(await imperativelyGetClosestPointForTime(replayClient, 21)).toBe("21");
      expect(mockClient.getPointsBoundingTime).toHaveBeenCalledTimes(2);
    });

    it("should fall back to the best guess nearest point if the backend throws", async () => {
      preCacheExecutionPointForTime({ time: 0, point: "0" });
      preCacheExecutionPointForTime({ time: 2, point: "2" });
      preCacheExecutionPointForTime({ time: 9, point: "9" });

      mockClient.getPointsBoundingTime.mockImplementation(() => {
        throw commandError("RecordingUnloaded", ProtocolError.RecordingUnloaded);
      });
      await expect(await imperativelyGetClosestPointForTime(replayClient, 3)).toBe("2");
      expect(mockClient.getPointsBoundingTime).toHaveBeenCalledTimes(1);
    });

    it("should re-throw errors other than unloaded region error", async () => {
      mockClient.getPointsBoundingTime.mockImplementation(() => {
        throw Error("Expected");
      });

      expect(async () => {
        await imperativelyGetClosestPointForTime(replayClient, 3);
      }).rejects.toThrow("Expected");
    });
  });

  describe("preCacheExecutionPointForTime", () => {
    it("should update caches to avoid unnecessary subsequent protocol requests", async () => {
      preCacheExecutionPointForTime({ time: 0, point: "0" });
      preCacheExecutionPointForTime({ time: 2, point: "2" });
      preCacheExecutionPointForTime({ time: 9, point: "9" });

      mockClient.getPointsBoundingTime.mockImplementation(() => {
        throw Error("Expected");
      });

      await expect(await getClosestPointForTimeSuspense(replayClient, 0)).toBe("0");
      await expect(await getClosestPointForTimeSuspense(replayClient, 2)).toBe("2");
      await expect(await getClosestPointForTimeSuspense(replayClient, 9)).toBe("9");

      await expect(await imperativelyGetClosestPointForTime(replayClient, 0)).toBe("0");
      await expect(await imperativelyGetClosestPointForTime(replayClient, 2)).toBe("2");
      await expect(await imperativelyGetClosestPointForTime(replayClient, 9)).toBe("9");
    });
  });
});
