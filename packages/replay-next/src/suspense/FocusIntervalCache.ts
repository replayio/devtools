import { ExecutionPoint } from "@replayio/protocol";
import {
  GetPointForValue,
  IntervalCache,
  IntervalCacheLoadOptions,
  createIntervalCache,
} from "suspense";

import { ProtocolError, isCommandError } from "shared/utils/error";
import { assert, breakdownSupplementalId } from "protocol/utils";

type Options<Point extends number | bigint, Params extends Array<any>, Value> = {
  debugLabel?: string;
  debugLogging?: boolean;
  getKey?: (...params: Params) => string;
  getPointForValue: GetPointForValue<Point, Value>;
  load: (
    start: Point,
    end: Point,
    ...params: [...Params, IntervalCacheLoadOptions<Value>]
  ) => PromiseLike<Array<Value>> | Array<Value>;
};

const gSupplementalFocusPointMap = new Map<ExecutionPoint, number>();

// This is an especially stupid hack to get the focus interval cache to include
// points from other recordings. As long as the focus interval contains the start
// of the recording we treat points in supplemental recordings as having a low
// yet unique (to avoid deduping) execution point that will be part of the
// focus window in the main recording.
function getSupplementalFocusIntervalPoint(transformedPoint: ExecutionPoint): bigint {
  const { supplementalIndex } = breakdownSupplementalId(transformedPoint);
  if (!supplementalIndex) {
    return BigInt(transformedPoint);
  }
  if (!gSupplementalFocusPointMap.has(transformedPoint)) {
    gSupplementalFocusPointMap.set(transformedPoint, gSupplementalFocusPointMap.size);
  }
  let existing = gSupplementalFocusPointMap.get(transformedPoint);
  assert(typeof existing == "number");
  return BigInt(existing);
}

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
      const transformedPoint = getPointForValue(value);
      return getSupplementalFocusIntervalPoint(transformedPoint);
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
        if (
          isCommandError(error, ProtocolError.FocusWindowChange) ||
          isCommandError(error, ProtocolError.RecordingUnloaded)
        ) {
          // Handle errors here by telling the cache "nothing got loaded".
          // This will cause the cache to retry the load if requested later.
          // The combo of `cache.abort()` + `returnAsPartial()` _seems_ to be necessary here,
          // based on experimentation.

          const params = paramsWithCacheLoadOptions.slice(0, -1) as Params;
          const intervalCacheOptions: IntervalCacheLoadOptions<Value> =
            paramsWithCacheLoadOptions[paramsWithCacheLoadOptions.length - 1];

          cache.abort(...params);

          return intervalCacheOptions.returnAsPartial([]);
        }
        throw error;
      }
    },
  });

  return cache;
}
