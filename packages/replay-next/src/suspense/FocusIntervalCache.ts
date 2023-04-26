import { ExecutionPoint } from "@replayio/protocol";
import {
  GetPointForValue,
  IntervalCache,
  IntervalCacheLoadOptions,
  createIntervalCache,
} from "suspense";

import { ProtocolError, isCommandError } from "shared/utils/error";

type Options<Point extends number | bigint, Params extends Array<any>, Value> = {
  debugLabel?: string;
  getKey?: (...params: Params) => string;
  getPointForValue: GetPointForValue<Point, Value>;
  load: (
    start: Point,
    end: Point,
    ...params: [...Params, IntervalCacheLoadOptions<Value>]
  ) => PromiseLike<Array<Value>> | Array<Value>;
};

// Convenience wrapper around createFocusIntervalCache that converts BigInts to ExecutionPoints (strings)
export function createFocusIntervalCacheForExecutionPoints<Params extends Array<any>, Value>(
  options: Omit<Options<bigint, Params, Value>, "getPointForValue" | "load"> & {
    getPointForValue: (value: Value) => ExecutionPoint;
    load: (
      start: ExecutionPoint,
      end: ExecutionPoint,
      ...params: [...Params, IntervalCacheLoadOptions<Value>]
    ) => PromiseLike<Array<Value>> | Array<Value>;
  }
) {
  const { getPointForValue, load, ...rest } = options;
  return createFocusIntervalCache<bigint, Params, Value>({
    ...rest,
    getPointForValue: (value: Value): bigint => {
      return BigInt(getPointForValue(value));
    },
    load: (start: bigint, end: bigint, ...params: [...Params, IntervalCacheLoadOptions<Value>]) =>
      load(start.toString(), end.toString(), ...params),
  });
}

export function createFocusIntervalCache<
  Point extends number | bigint,
  Params extends Array<any>,
  Value
>(options: Options<Point, Params, Value>): IntervalCache<Point, Params, Value> {
  const cache = createIntervalCache<Point, Params, Value>({
    ...options,
    load: async (start, end, ...paramsWithCacheLoadOptions) => {
      try {
        return await options.load(start, end, ...paramsWithCacheLoadOptions);
      } catch (error) {
        if (isCommandError(error, ProtocolError.FocusWindowChange)) {
          const params = paramsWithCacheLoadOptions.slice(0, -1) as Params;
          cache.abort(...params);
        }
        throw error;
      }
    },
  });

  return cache;
}
