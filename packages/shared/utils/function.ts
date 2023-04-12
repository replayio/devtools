import { Deferred, createDeferred, isPromiseLike } from "suspense";

export interface DebouncedOrThrottledFunction<
  Function extends (...args: any[]) => void | Promise<void>
> {
  (...args: Parameters<Function>): Promise<void>;
  cancel(): void;
  hasPending(): boolean;
  flush(): Promise<void>;
}

// Note this implementation makes two simplifying constraints:
// 1: A function must have a void return value;
//    This avoids the need to return a wrapper Promise for pending values or manage invalidation of said wrapper.
// 2: Debouncing only takes call time into account (not duration).
//    If an async function runs longer than the debounce duration,
//    a second invocation may start running in parallel.
//
// The main advantages this implementation has over lodash's debounce/throttle are:
// 1: The ability to query if there is a pending callback.
// 2: Calling flush() if there is no pending callback will do nothing;
//    it will not invoke the most recent (already completed) callback.

function createDebouncedOrThrottledFunction<Function extends (...args: any) => any>(
  func: Function,
  delay: number,
  mode: "debounce" | "throttle"
): DebouncedOrThrottledFunction<Function> {
  let lastArgs: any[] | undefined;
  let lastThis: any;
  let lastCallTime = 0 - delay;
  let lastInvokeTime = 0 - delay;
  let pending: Deferred<void> | undefined;
  let timeoutId: NodeJS.Timeout | undefined = undefined;

  function cancelIfPending() {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    resetCachedValues();
  }

  async function flushIfPending(): Promise<void> {
    if (timeoutId !== undefined) {
      await invokeCallback();
    }
  }

  function getTimeout(time: number): number {
    switch (mode) {
      case "debounce":
        return Math.max(0, lastCallTime + delay - time);
      case "throttle":
        return Math.max(0, lastInvokeTime + delay - time);
    }
  }

  function hasPending() {
    return timeoutId !== undefined;
  }

  async function invokeCallback(): Promise<void> {
    lastInvokeTime = performance.now();

    try {
      const result = func.apply(lastThis, lastArgs as any[]);
      if (result != undefined && isPromiseLike(result)) {
        await result;
      }
    } finally {
      pending?.resolve();
      pending = undefined;

      resetCachedValues();
    }
  }

  function resetCachedValues() {
    lastArgs = undefined;
    lastThis = undefined;
    timeoutId = undefined;
  }

  async function debouncedOrThrottledFunction(...args: any[]): Promise<void> {
    cancelIfPending();

    const time = performance.now();

    lastArgs = args;
    // @ts-ignore
    lastThis = this;
    lastCallTime = time;

    const timeout = getTimeout(time);
    if (timeout === 0) {
      await invokeCallback();
    } else {
      if (pending === undefined) {
        pending = createDeferred();
      }

      timeoutId = setTimeout(flushIfPending, timeout);

      await pending.promise;
    }
  }

  debouncedOrThrottledFunction.cancel = cancelIfPending;
  debouncedOrThrottledFunction.flush = flushIfPending;
  debouncedOrThrottledFunction.hasPending = hasPending;

  return debouncedOrThrottledFunction as DebouncedOrThrottledFunction<Function>;
}

export function debounce<Function extends (...args: any) => any>(
  func: Function,
  delay: number
): DebouncedOrThrottledFunction<Function> {
  return createDebouncedOrThrottledFunction(func, delay, "debounce");
}

export function throttle<Function extends (...args: any) => any>(
  func: Function,
  delay: number
): DebouncedOrThrottledFunction<Function> {
  return createDebouncedOrThrottledFunction(func, delay, "throttle");
}
