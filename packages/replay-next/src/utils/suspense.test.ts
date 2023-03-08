import {
  Deferred,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
  StatusPending,
  StatusRejected,
  StatusResolved,
  createDeferred,
} from "suspense";

import {
  __setCircularThenableCheckMaxCount,
  createFetchAsyncFromFetchSuspense,
  createInfallibleSuspenseCache,
  suspendInParallel,
} from "./suspense";

describe("Suspense util", () => {
  describe("createFetchAsyncFromFetchSuspense", () => {
    function createFakeSuspenseCache(): (resolvedValue?: number) => number {
      const deferred: Deferred<number> | null = createDeferred<number>("Fake value");

      let status: StatusPending | StatusRejected | StatusResolved | null = null;

      return function getValue(resolvedValue?: number) {
        if (status === null) {
          status = STATUS_PENDING;

          Promise.resolve().then(() => {
            if (resolvedValue !== undefined) {
              deferred?.resolve(resolvedValue);
            } else {
              deferred?.reject(Error("Failed"));
            }
          });

          throw deferred;
        } else {
          if (resolvedValue !== undefined) {
            status = STATUS_RESOLVED;
            return resolvedValue;
          } else {
            status = STATUS_REJECTED;
            throw Error("Failed");
          }
        }
      };
    }

    it("awaits the result of a function that suspends", async () => {
      const cache = createFakeSuspenseCache();
      const callback = createFetchAsyncFromFetchSuspense(cache);
      expect(await callback(123)).toBe(123);
      expect(await callback(234)).toBe(234);
    });

    it("awaits the result of a function that suspends multiple times", async () => {
      const cache1 = createFakeSuspenseCache();
      const cache2 = createFakeSuspenseCache();
      const compositeCache = (num: number) => {
        return cache1(100) + cache2(10) + num;
      };
      const callback = await createFetchAsyncFromFetchSuspense(compositeCache);
      expect(await callback(1)).toBe(111);
    });

    it("re-throws errors", async () => {
      const cache = createFakeSuspenseCache();
      const callback = createFetchAsyncFromFetchSuspense(cache);
      await expect(callback).rejects.toThrowError("Failed");
    });

    it("re-throws errors after suspending", async () => {
      const cache1 = createFakeSuspenseCache();
      const cache2 = createFakeSuspenseCache();
      const compositeCache = () => {
        return cache1(100) + cache2();
      };
      const callback = createFetchAsyncFromFetchSuspense(compositeCache);
      await expect(callback).rejects.toThrowError("Failed");
    });
  });

  describe("createInfallibleSuspenseCache", () => {
    it("should pass through params and return value when Suspense is successful", () => {
      const cache = jest.fn().mockImplementation(params => {
        return params * 2;
      });
      const infallibleCache = createInfallibleSuspenseCache(cache);

      expect(infallibleCache(1)).toEqual(2);
      expect(infallibleCache(123)).toEqual(246);
    });

    it("it should return undefined when the Suspense cache throws", () => {
      const cache = jest.fn().mockImplementation(() => {
        throw Error("Expected error");
      });
      const infallibleCache = createInfallibleSuspenseCache(cache);

      expect(infallibleCache()).toEqual(undefined);
    });
  });

  describe("suspendInParallel", () => {
    it("should call all callbacks before re-throwing any thrown value", () => {
      const callbackA = jest.fn();
      const callbackB = jest.fn().mockImplementation(() => {
        throw Error("Expected error");
      });
      const callbackC = jest.fn();

      expect(() => {
        suspendInParallel(callbackA, callbackB, callbackC);
      }).toThrow("Expected error");

      expect(callbackA).toHaveBeenCalled();
      expect(callbackB).toHaveBeenCalled();
      expect(callbackC).toHaveBeenCalled();
    });

    it("should return all values if none of the callbacks suspend", () => {
      const callbackA = () => 123;
      const callbackB = () => "abc";

      const [a, b] = suspendInParallel(callbackA, callbackB);

      expect(a).toEqual(123);
      expect(b).toEqual("abc");
    });
  });
});
