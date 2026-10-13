import { Deferred, Status, createDeferred } from "suspense";

import { DebouncedOrThrottledFunction, debounce, throttle } from "./function";

describe("function", () => {
  describe("debounce", () => {
    let asyncFunc: jest.Mock;
    let debouncedAsyncFunc: DebouncedOrThrottledFunction<any>;
    let debouncedFunc: DebouncedOrThrottledFunction<any>;
    let func: jest.Mock;
    let mostRecentDeferred: Deferred<any> | undefined;

    beforeEach(() => {
      mostRecentDeferred = undefined;

      asyncFunc = jest.fn(async () => {
        mostRecentDeferred = createDeferred();
        await mostRecentDeferred.promise;
      });
      func = jest.fn();

      debouncedAsyncFunc = debounce(asyncFunc, 100);
      debouncedFunc = debounce(func, 100);

      jest.useFakeTimers();
    });

    it("should call the inner function after the specified delay", () => {
      debouncedFunc(123, "abc");
      jest.advanceTimersByTime(99);
      expect(func).not.toBeCalled();

      jest.advanceTimersByTime(1);
      expect(func).toBeCalledTimes(1);
      expect(func).toBeCalledWith(123, "abc");
    });

    it("should replace previous pending call with new call", () => {
      debouncedFunc("a");
      jest.advanceTimersByTime(50);
      expect(func).not.toBeCalled();

      // This should replace the previous call AND reset the timer
      debouncedFunc("b");
      jest.advanceTimersByTime(75);
      expect(func).not.toBeCalled();

      jest.advanceTimersByTime(25);
      expect(func).toBeCalledTimes(1);
      expect(func).toBeCalledWith("b");
    });

    it("should await the eventual callback", async () => {
      debouncedAsyncFunc("a");

      let resolvedCount = 0;
      let promises: Promise<any>[] = [
        debouncedAsyncFunc("b").then(() => {
          resolvedCount++;
        }),
        debouncedAsyncFunc("c").then(() => {
          resolvedCount++;
        }),
        debouncedAsyncFunc("d").then(() => {
          resolvedCount++;
        }),
      ];

      jest.advanceTimersByTime(100);

      await Promise.resolve();
      expect(resolvedCount).toBe(0);

      mostRecentDeferred!.resolve();

      await Promise.all(promises);
      await expect(resolvedCount).toBe(3);
    });

    describe("cancel", () => {
      it("should cancel a pending callback", () => {
        debouncedFunc("a");
        debouncedFunc.cancel();
        jest.advanceTimersByTime(200);
        expect(func).not.toBeCalled();
      });

      it("should do nothing if no pending callback", () => {
        debouncedFunc.cancel();
      });
    });

    describe("hasPending", () => {
      it("should return true if there is a pending callback", () => {
        debouncedFunc("a");
        expect(func).not.toBeCalled();
        expect(debouncedFunc.hasPending()).toBe(true);

        jest.advanceTimersByTime(100);
        expect(func).toBeCalledTimes(1);
        expect(debouncedFunc.hasPending()).toBe(false);
      });

      it("should return false if there is no pending callback", () => {
        expect(debouncedFunc.hasPending()).toBe(false);
      });
    });

    describe("flush", () => {
      it("should flush a pending callback", () => {
        debouncedFunc(123, "abc");
        expect(func).not.toBeCalled();

        debouncedFunc.flush();
        expect(func).toBeCalledTimes(1);
        expect(func).toBeCalledWith(123, "abc");

        expect(debouncedFunc.hasPending()).toBe(false);
        debouncedFunc.flush();
        expect(func).toBeCalledTimes(1);
      });

      it("should do nothing if no pending callback", () => {
        debouncedFunc.flush();
      });

      it("should await the pending callback", async () => {
        debouncedAsyncFunc("a");
        expect(debouncedAsyncFunc.hasPending()).toBe(true);

        let resolved = false;
        const promise = debouncedAsyncFunc.flush().then(() => {
          resolved = true;
        });

        await Promise.resolve();
        expect(resolved).toBe(false);

        mostRecentDeferred!.resolve();
        await promise;
        expect(resolved).toBe(true);
      });
    });
  });

  describe("throttle", () => {
    let asyncFunc: jest.Mock;
    let throttledAsyncFunc: DebouncedOrThrottledFunction<any>;
    let throttledFunc: DebouncedOrThrottledFunction<any>;
    let func: jest.Mock;
    let mostRecentDeferred: Deferred<any> | undefined;

    beforeEach(() => {
      mostRecentDeferred = undefined;

      asyncFunc = jest.fn(async () => {
        mostRecentDeferred = createDeferred();
        await mostRecentDeferred.promise;
      });
      func = jest.fn();

      throttledAsyncFunc = throttle(asyncFunc, 100);
      throttledFunc = throttle(func, 100);

      jest.useFakeTimers();
    });

    it("should call the inner function after the specified delay", () => {
      throttledFunc(123, "abc");
      expect(func).toBeCalledTimes(1);
      expect(func).toBeCalledWith(123, "abc");

      throttledFunc(456, "def");
      jest.advanceTimersByTime(99);
      expect(func).toBeCalledTimes(1);

      jest.advanceTimersByTime(1);
      expect(func).toBeCalledTimes(2);
      expect(func).toBeCalledWith(456, "def");
    });

    it("should replace previous pending call with new call", () => {
      throttledFunc("a");
      expect(func).toBeCalledTimes(1);
      expect(func).toBeCalledWith("a");

      throttledFunc("b");
      jest.advanceTimersByTime(75);
      expect(func).toBeCalledTimes(1);

      // This should replace the previous call BUT not reset the timer
      throttledFunc("c");
      jest.advanceTimersByTime(24);
      expect(func).toBeCalledTimes(1);

      jest.advanceTimersByTime(1);
      expect(func).toBeCalledTimes(2);
      expect(func).toBeCalledWith("c");
    });

    it("should await a non-throttled callback", async () => {
      let resolved = false;
      const promise = throttledAsyncFunc("a").then(() => {
        resolved = true;
      });

      await Promise.resolve();
      expect(resolved).toBe(false);

      mostRecentDeferred!.resolve();
      await promise;
      expect(resolved).toBe(true);
    });

    it("should await the eventual callback (if throttled)", async () => {
      throttledAsyncFunc("a");

      let resolvedCount = 0;
      let promises: Promise<any>[] = [
        throttledAsyncFunc("b").then(() => {
          resolvedCount++;
        }),
        throttledAsyncFunc("c").then(() => {
          resolvedCount++;
        }),
        throttledAsyncFunc("d").then(() => {
          resolvedCount++;
        }),
      ];

      await Promise.resolve();
      expect(resolvedCount).toBe(0);

      mostRecentDeferred!.resolve();

      await Promise.all(promises);
      await expect(resolvedCount).toBe(3);
    });

    describe("cancel", () => {
      it("should cancel a pending callback", () => {
        throttledFunc("a");
        expect(func).toBeCalledTimes(1);

        throttledFunc("b");
        throttledFunc.cancel();
        jest.advanceTimersByTime(200);
        expect(func).toBeCalledTimes(1);
      });

      it("should do nothing if no pending callback", () => {
        throttledFunc.cancel();
      });
    });

    describe("hasPending", () => {
      it("should return true if there is a pending callback", () => {
        throttledFunc("a");
        expect(func).toBeCalledTimes(1);
        expect(throttledFunc.hasPending()).toBe(false);

        throttledFunc("b");
        expect(throttledFunc.hasPending()).toBe(true);

        jest.advanceTimersByTime(100);
        expect(func).toBeCalledTimes(2);
        expect(throttledFunc.hasPending()).toBe(false);
      });

      it("should return false if there is no pending callback", () => {
        expect(throttledFunc.hasPending()).toBe(false);
      });
    });

    describe("flush", () => {
      it("should flush a pending callback", () => {
        throttledFunc(123, "abc");
        expect(func).toBeCalledTimes(1);
        expect(func).toBeCalledWith(123, "abc");

        throttledFunc(456, "def");
        expect(func).toBeCalledTimes(1);

        throttledFunc.flush();
        expect(func).toBeCalledTimes(2);
        expect(func).toBeCalledWith(456, "def");

        expect(throttledFunc.hasPending()).toBe(false);
        throttledFunc.flush();
        expect(func).toBeCalledTimes(2);
      });

      it("should do nothing if no pending callback", () => {
        throttledFunc.flush();
      });

      it("should await the pending callback", async () => {
        throttledAsyncFunc("a");
        expect(throttledAsyncFunc.hasPending()).toBe(false);

        throttledAsyncFunc("b");
        expect(throttledAsyncFunc.hasPending()).toBe(true);

        let resolved = false;
        const promise = throttledAsyncFunc.flush().then(() => {
          resolved = true;
        });

        await Promise.resolve();
        expect(resolved).toBe(false);

        mostRecentDeferred!.resolve();
        await promise;
        expect(resolved).toBe(true);
      });
    });
  });
});
