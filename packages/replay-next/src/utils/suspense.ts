import { Cache, CreateCacheOptions, createCache, isPromiseLike } from "suspense";

import { recordData as recordTelemetryData } from "./telemetry";

type AnyFunction<ReturnType> = (...args: any[]) => ReturnType;

let MAX_LOOP_COUNT = 1_000;

export function createCacheWithTelemetry<Params extends Array<any>, Value>(
  options: Omit<CreateCacheOptions<Params, Value>, "debugLabel"> & {
    debugLabel: string;
  }
): Cache<Params, Value> {
  const { debugLabel, load, ...rest } = options;

  return createCache({
    ...rest,
    debugLabel,
    load: async (params, loadOptions) => {
      const startTime = Date.now();
      const result = await load(params, loadOptions);
      const stopTime = Date.now();

      // Fire and forget telemetry (if enabled)
      recordTelemetryData("suspense-cache-load", {
        duration: stopTime - startTime,
        label: debugLabel,
        params,
        type: "suspense-cache",
      });

      return result;
    },
  });
}

const key = Symbol.for("createSingleEntryCache").toString();

export function createSingleEntryCacheWithTelemetry<Params extends Array<any>, Value>(
  options: Omit<CreateCacheOptions<Params, Value>, "debugLabel" | "getKey"> & {
    debugLabel: string;
  }
): Cache<Params, Value> {
  return createCacheWithTelemetry<Params, Value>({
    getKey: () => key,
    ...options,
  });
}

export function createFetchAsyncFromFetchSuspense<TParams extends Array<any>, TValue>(
  suspenseCache: (...params: TParams) => TValue
): (...params: TParams) => Promise<TValue> {
  return async function fetchAsync(...params: TParams): Promise<TValue> {
    let loopCount = 0;

    // We use a loop because the Suspense callback may suspend to fetch multiple values.
    while (true) {
      loopCount++;

      try {
        return await suspenseCache(...params);
      } catch (errorOrPromise) {
        if (isPromiseLike(errorOrPromise)) {
          await errorOrPromise;
        } else {
          throw errorOrPromise;
        }
      }

      if (loopCount > MAX_LOOP_COUNT) {
        throw new Error("Suspense loop exceeded maximum loop count");
      }
    }
  };
}

export function createInfallibleSuspenseCache<TParams extends Array<any>, TValue>(
  suspenseCache: (...params: TParams) => TValue
): (...params: TParams) => TValue | undefined {
  return function createInfallibleSuspenseCache(...params) {
    try {
      return suspenseCache(...params);
    } catch (errorOrThenable) {
      if (isPromiseLike(errorOrThenable)) {
        throw errorOrThenable;
      } else {
        return undefined;
      }
    }
  };
}

// Helper function to read from multiple Suspense caches in parallel.
// This method will re-throw any thrown value, but only after also calling subsequent caches.
export function suspendInParallel<T extends AnyFunction<any>[]>(
  ...callbacks: [...T]
): { [K in keyof T]: ReturnType<Extract<T[K], AnyFunction<any>>> } {
  const values: any[] = [];
  let thrownValue = null;

  callbacks.forEach(callback => {
    try {
      values.push(callback());
    } catch (error) {
      thrownValue = error;
    }
  });

  if (thrownValue !== null) {
    throw thrownValue;
  }

  return values as { [K in keyof T]: ReturnType<Extract<T[K], AnyFunction<any>>> };
}

// Expose max circular check count for testing purposes.
export function __setCircularThenableCheckMaxCount(value: number) {
  MAX_LOOP_COUNT = value;
}
