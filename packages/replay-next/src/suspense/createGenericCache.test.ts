import { isThennable } from "shared/proxy/utils";

import {
  GenericCache,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
  createGenericCache,
} from "./createGenericCache";

describe("createGenericCache", () => {
  let fetchValue: jest.Mock;
  let cache: GenericCache<[], [string], string>;
  let getCacheKey: jest.Mock;

  beforeEach(() => {
    fetchValue = jest.fn();
    fetchValue.mockImplementation((key: string) => {
      if (key.startsWith("async")) {
        return Promise.resolve(key);
      } else if (key.startsWith("error")) {
        return Promise.reject(key);
      } else {
        return key;
      }
    });

    getCacheKey = jest.fn();
    getCacheKey.mockImplementation(key => key.toString());

    cache = createGenericCache<[], [string], string>("test", fetchValue, getCacheKey);
  });

  describe("addValue", () => {
    it("should cache and return pre-fetched values without reloading", () => {
      cache.addValue("SYNC", "sync-1");
      cache.addValue("ASYNC", "async-1");

      expect(cache.getValueIfCached("sync-1")).toEqual({ value: "SYNC" });
      expect(cache.getValueIfCached("async-1")).toEqual({ value: "ASYNC" });

      expect(fetchValue).not.toHaveBeenCalled();
    });
  });

  describe("getStatus", () => {
    it("should return undefined for keys that have not been loaded", () => {
      expect(cache.getStatus("nope")).toBeUndefined();
    });

    it("should transition from pending to resolved", async () => {
      const willResolve = cache.getValueAsync("async");

      expect(cache.getStatus("async")).toBe(STATUS_PENDING);

      await willResolve;

      expect(cache.getStatus("async")).toBe(STATUS_RESOLVED);
    });

    it("should transition from pending to rejected", async () => {
      fetchValue.mockReturnValue(Promise.reject("Expected"));

      const willReject = cache.getValueAsync("error");

      expect(cache.getStatus("error")).toBe(STATUS_PENDING);

      try {
        await willReject;
      } catch (error) {}

      expect(cache.getStatus("error")).toBe(STATUS_REJECTED);
    });

    it("should return resolved or rejected for keys that have already been loaded", async () => {
      const willResolve = cache.getValueAsync("sync");
      await willResolve;
      expect(cache.getStatus("sync")).toBe(STATUS_RESOLVED);

      const willReject = cache.getValueAsync("error");
      try {
        await willReject;
      } catch (error) {}
      expect(cache.getStatus("error")).toBe(STATUS_REJECTED);
    });
  });

  describe("getValueAsync", () => {
    it("should return async values", async () => {
      const thennable = cache.getValueAsync("async");

      expect(isThennable(thennable)).toBe(true);

      await expect(await thennable).toBe("async");
    });

    it("should return sync values", () => {
      expect(cache.getValueAsync("sync")).toBe("sync");
    });

    it("should only load the same value once (per key)", () => {
      expect(cache.getValueAsync("sync")).toBe("sync");
      expect(cache.getValueAsync("sync")).toBe("sync");

      expect(fetchValue).toHaveBeenCalledTimes(1);
    });
  });

  describe("getValueIfCached", () => {
    it("should return undefined for values not yet loaded", () => {
      expect(cache.getValueIfCached("sync")).toBeUndefined();
    });

    it("should not trigger a fetch", () => {
      expect(cache.getValueIfCached("sync")).toBeUndefined();
      expect(fetchValue).not.toHaveBeenCalled();
    });

    it("should return undefined for values that are pending", () => {
      cache.getValueAsync("async");
      expect(cache.getValueIfCached("async")).toBeUndefined();
    });

    it("should return a cached value for values that have resolved", () => {
      cache.getValueAsync("sync");
      expect(cache.getValueIfCached("sync")).toEqual({ value: "sync" });
    });

    it("should return a cached error for values that have rejected", async () => {
      cache.getValueAsync("error");
      await Promise.resolve();
      expect(() => cache.getValueIfCached("error")).toThrow("error");
    });
  });

  describe("getValueSuspense", () => {
    it("should suspend on async values", async () => {
      try {
        cache.getValueSuspense("async");

        throw new Error("should have suspended");
      } catch (thennable) {
        expect(isThennable(thennable)).toBe(true);

        await thennable;

        expect(cache.getValueSuspense("async")).toBe("async");
      }
    });

    it("should not suspend on sync values", () => {
      expect(cache.getValueSuspense("sync")).toBe("sync");
    });

    it("should only fetch the same value once (per key)", () => {
      expect(cache.getValueSuspense("sync")).toBe("sync");
      expect(cache.getValueSuspense("sync")).toBe("sync");

      expect(fetchValue).toHaveBeenCalledTimes(1);
    });
  });

  describe("subscribeToStatus", () => {
    let callbackA: jest.Mock;
    let callbackB: jest.Mock;

    beforeEach(() => {
      callbackA = jest.fn();
      callbackB = jest.fn();
    });

    it("should subscribe to keys that have not been loaded", async () => {
      cache.subscribeToStatus(callbackA, "sync");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(undefined);

      await Promise.resolve();

      expect(callbackA).toHaveBeenCalledTimes(1);
    });

    it("should notify of the transition from undefined to resolved for synchronous caches", async () => {
      cache.subscribeToStatus(callbackA, "sync");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(undefined);

      cache.getValueAsync("sync");

      expect(callbackA).toHaveBeenCalledTimes(3);
      expect(callbackA).toHaveBeenCalledWith(STATUS_PENDING);
      expect(callbackA).toHaveBeenCalledWith(STATUS_RESOLVED);
    });

    it("should notify of the transition from undefined to from pending to resolved for async caches", async () => {
      cache.subscribeToStatus(callbackA, "async");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(undefined);

      const thennable = cache.getValueAsync("async");

      expect(callbackA).toHaveBeenCalledTimes(2);
      expect(callbackA).toHaveBeenCalledWith(STATUS_PENDING);

      await thennable;

      expect(callbackA).toHaveBeenCalledTimes(3);
      expect(callbackA).toHaveBeenCalledWith(STATUS_RESOLVED);
    });

    it("should only notify each subscriber once", async () => {
      cache.subscribeToStatus(callbackA, "sync");
      cache.subscribeToStatus(callbackB, "sync");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(undefined);

      expect(callbackB).toHaveBeenCalledTimes(1);
      expect(callbackB).toHaveBeenCalledWith(undefined);

      cache.getValueAsync("sync");

      expect(callbackA).toHaveBeenCalledTimes(3);
      expect(callbackA).toHaveBeenCalledWith(STATUS_PENDING);
      expect(callbackA).toHaveBeenCalledWith(STATUS_RESOLVED);

      expect(callbackB).toHaveBeenCalledTimes(3);
      expect(callbackB).toHaveBeenCalledWith(STATUS_PENDING);
      expect(callbackB).toHaveBeenCalledWith(STATUS_RESOLVED);
    });

    it("should not notify after a subscriber unsubscribes", async () => {
      const unsubscribe = cache.subscribeToStatus(callbackA, "sync");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(undefined);

      unsubscribe();

      cache.getValueAsync("sync");

      expect(callbackA).toHaveBeenCalledTimes(1);
    });

    it("should track subscribers separately, per key", async () => {
      cache.subscribeToStatus(callbackA, "sync-1");
      cache.subscribeToStatus(callbackB, "sync-2");

      callbackA.mockReset();
      callbackB.mockReset();

      cache.getValueAsync("sync-2");

      expect(callbackA).not.toHaveBeenCalled();
      expect(callbackB).toHaveBeenCalledTimes(2);
    });

    it("should track unsubscriptions separately, per key", async () => {
      const unsubscribeA = cache.subscribeToStatus(callbackA, "sync-1");
      cache.subscribeToStatus(callbackB, "sync-2");

      callbackA.mockReset();
      callbackB.mockReset();

      unsubscribeA();

      cache.getValueAsync("sync-1");
      cache.getValueAsync("sync-2");

      expect(callbackA).not.toHaveBeenCalled();
      expect(callbackB).toHaveBeenCalledTimes(2);
    });

    it("should return the correct value for keys that have already been resolved or rejected", async () => {
      cache.getValueAsync("async");
      cache.getValueAsync("error");

      await Promise.resolve();

      cache.subscribeToStatus(callbackA, "async");
      cache.subscribeToStatus(callbackB, "error");

      expect(callbackA).toHaveBeenCalledWith(STATUS_RESOLVED);
      expect(callbackB).toHaveBeenCalledWith(STATUS_REJECTED);
    });
  });
});
