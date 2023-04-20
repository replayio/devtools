import {
  ComparisonFunction,
  GetPointForValue,
  IntervalCache,
  IntervalCacheLoadOptions,
  SerializableToString,
  createIntervalCache,
} from "suspense";

import { ProtocolError, isCommandError } from "shared/utils/error";

export function createFocusIntervalCache<
  Point extends SerializableToString,
  Params extends Array<any>,
  Value
>(options: {
  comparePoints?: ComparisonFunction<Point>;
  debugLabel?: string;
  getKey?: (...params: Params) => string;
  getPointForValue: GetPointForValue<Point, Value>;
  load: (
    start: Point,
    end: Point,
    ...params: [...Params, IntervalCacheLoadOptions]
  ) => PromiseLike<Value[]> | Value[];
}): IntervalCache<Point, Params, Value> {
  const cache = createIntervalCache({
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
