import {
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
  StatusPending,
  StatusRejected,
  StatusResolved,
  Wakeable,
} from "replay-next/src/suspense/types";

import {
  __setCircularThenableCheckMaxCount,
  createFetchAsyncFromFetchSuspense,
  createInfallibleSuspenseCache,
  createWakeable,
  suspendInParallel,
} from "./suspense";

describe("Suspense util", () => {
  describe("createWakeable", () => {
    it("should call registered listeners when rejected", () => {
      const error = new Error("This is an error");

      const onFulfillA = jest.fn();
      const onFulfillB = jest.fn();
      const onRejectA = jest.fn();
      const onRejectB = jest.fn();

      const wakeable = createWakeable("test");
      wakeable.then(onFulfillA, onRejectA);
      wakeable.then(onFulfillB, onRejectB);

      expect(onFulfillA).not.toHaveBeenCalled();
      expect(onFulfillB).not.toHaveBeenCalled();
      expect(onRejectA).not.toHaveBeenCalled();
      expect(onRejectB).not.toHaveBeenCalled();

      wakeable.reject(error);

      expect(onFulfillA).not.toHaveBeenCalled();
      expect(onFulfillB).not.toHaveBeenCalled();
      expect(onRejectA).toHaveBeenCalledWith(error);
      expect(onRejectB).toHaveBeenCalledWith(error);
    });

    it("should call registered listeners when resolved", () => {
      const onFulfillA = jest.fn();
      const onFulfillB = jest.fn();
      const onRejectA = jest.fn();
      const onRejectB = jest.fn();

      const wakeable = createWakeable("test");
      wakeable.then(onFulfillA, onRejectA);
      wakeable.then(onFulfillB, onRejectB);

      expect(onFulfillA).not.toHaveBeenCalled();
      expect(onFulfillB).not.toHaveBeenCalled();
      expect(onRejectA).not.toHaveBeenCalled();
      expect(onRejectB).not.toHaveBeenCalled();

      wakeable.resolve(123);

      expect(onFulfillA).toHaveBeenCalledWith(123);
      expect(onFulfillB).toHaveBeenCalledWith(123);
      expect(onRejectA).not.toHaveBeenCalled();
      expect(onRejectB).not.toHaveBeenCalled();
    });

    it("should call registered listeners that are added after rejection", () => {
      const error = new Error("This is an error");

      const rejectedInitially = jest.fn();
      const throwsIfCalled = () => {
        throw Error("Should not be called");
      };

      const wakeable = createWakeable("test");
      wakeable.then(throwsIfCalled, rejectedInitially);
      wakeable.reject(error);
      expect(rejectedInitially).toHaveBeenCalledWith(error);
      expect(rejectedInitially).toHaveBeenCalledTimes(1);

      const rejectedLater = jest.fn();
      wakeable.then(throwsIfCalled, rejectedLater);

      expect(rejectedLater).toHaveBeenCalledWith(error);
      expect(rejectedLater).toHaveBeenCalledTimes(1);
      expect(rejectedInitially).toHaveBeenCalledTimes(1);
    });

    it("should call registered listeners that are added after resolution", () => {
      const resolvedInitially = jest.fn();
      const throwsIfCalled = () => {
        throw Error("Should not be called");
      };

      const wakeable = createWakeable("test");
      wakeable.then(resolvedInitially, throwsIfCalled);

      wakeable.resolve(123);
      expect(resolvedInitially).toHaveBeenCalledWith(123);
      expect(resolvedInitially).toHaveBeenCalledTimes(1);

      const resolvedLater = jest.fn();
      wakeable.then(resolvedLater, throwsIfCalled);

      expect(resolvedLater).toHaveBeenCalledWith(123);
      expect(resolvedLater).toHaveBeenCalledTimes(1);
      expect(resolvedInitially).toHaveBeenCalledTimes(1);
    });

    it("should not allow rejecting or resolving the same wakeable more than once", () => {
      const error = new Error("This is an error");

      const alreadyRejected = createWakeable("test");
      alreadyRejected.reject(error);

      const alreadyResolved = createWakeable("test");
      alreadyResolved.resolve(123);

      expect(() => {
        alreadyRejected.resolve(123);
      }).toThrowError("Wakeable has already been rejected");

      expect(() => {
        alreadyRejected.reject(error);
      }).toThrowError("Wakeable has already been rejected");

      expect(() => {
        alreadyResolved.resolve(123);
      }).toThrowError("Wakeable has already been resolved");

      expect(() => {
        alreadyResolved.reject(error);
      }).toThrowError("Wakeable has already been resolved");
    });
  });

  describe("circular thenable chains", () => {
    const registerSyncListeners = (wakeable: Wakeable<number>, iterations: number) => {
      for (let i = 0; i < iterations; i++) {
        wakeable.then(
          () => {},
          () => {}
        );
      }
    };

    const verifyThrows = (wakeable: Wakeable<number>, iterations: number) => {
      expect(() => registerSyncListeners(wakeable, iterations)).toThrowError(
        "Circular thenable chain detected"
      );
    };

    beforeEach(() => {
      __setCircularThenableCheckMaxCount(5);
    });

    it("should not throw if count is not exceeded", () => {
      const wakeable = createWakeable<number>("test");
      wakeable.resolve(123);
      registerSyncListeners(wakeable, 5);
    });

    it("should throw if count is exceeded", () => {
      const wakeable = createWakeable<number>("test");
      wakeable.resolve(123);
      verifyThrows(wakeable, 6);
    });

    it("should re-throw if count is exceeded multiple times", () => {
      const wakeable = createWakeable<number>("test");
      wakeable.resolve(123);
      verifyThrows(wakeable, 6);
      verifyThrows(wakeable, 1);
    });

    it("should detect loops that span ticks", async () => {
      const wakeable = createWakeable<number>("test");
      wakeable.resolve(123);
      registerSyncListeners(wakeable, 3);
      await new Promise(resolve => setTimeout(resolve, 0));
      verifyThrows(wakeable, 3);
    });

    it("should detect loops that span ticks variant", async () => {
      const wakeable = createWakeable<number>("test");
      wakeable.resolve(123);

      let caught = null;
      try {
        for (let i = 0; i <= 5; i++) {
          wakeable.then(
            () => {},
            () => {}
          );
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      } catch (error) {
        caught = error;
      }

      expect(caught).not.toBeNull();
    });

    it("should track loops separately per wakeable", async () => {
      const wakeableA = createWakeable<number>("test");
      wakeableA.resolve(123);

      const wakeableB = createWakeable<number>("test");
      wakeableB.resolve(456);

      // Total count exceeds loop but not individually
      registerSyncListeners(wakeableA, 5);
      registerSyncListeners(wakeableB, 3);

      // Wakeable A should now throw
      verifyThrows(wakeableA, 1);

      // But Wakeable B should not
      registerSyncListeners(wakeableB, 2);
    });
  });

  describe("createFetchAsyncFromFetchSuspense", () => {
    function createFakeSuspenseCache(): (resolvedValue?: number) => number {
      const wakeable: Wakeable<number> | null = createWakeable<number>("Fake value");

      let status: StatusPending | StatusRejected | StatusResolved | null = null;

      return function getValue(resolvedValue?: number) {
        if (status === null) {
          status = STATUS_PENDING;

          Promise.resolve().then(() => {
            if (resolvedValue !== undefined) {
              wakeable?.resolve(resolvedValue);
            } else {
              wakeable?.reject(Error("Failed"));
            }
          });

          throw wakeable;
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
