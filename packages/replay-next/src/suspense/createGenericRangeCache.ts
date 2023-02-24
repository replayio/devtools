import { ExecutionPoint, PointRange } from "@replayio/protocol";
import sortBy from "lodash/sortBy";

import { ReplayClientInterface } from "shared/client/types";

import {
  Range,
  getMissingRanges,
  isInRange,
  mergeRanges,
  rangeContains,
  rangesOverlap,
} from "../utils/range-list";
import { Subscriber, UnsubscribeFunction } from "./SearchCache";
import { Thennable } from "./types";

export interface RangeCache<T> {
  getValuesSuspense(client: ReplayClientInterface, range: PointRange): T[];
  getValuesAsync(client: ReplayClientInterface, range: PointRange): Thennable<T[]> | T[];
  getCachedValues(range: PointRange): T[];
}

interface RangeStore<T> {
  cachedRanges: Range[];
  valuesFromCachedRanges: T[];
  pendingRanges: Range[];
  valuesFromPendingRanges: T[];
  subscribe(subscriber: Subscriber): UnsubscribeFunction;
  notifySubscribers(): void;
  fetchMissingRanges(client: ReplayClientInterface, range: PointRange): Promise<void>;
  getExecutionPoint: (value: T) => ExecutionPoint;
}

interface PendingRange<T> {
  range: Range;
  values: T[];
  promise?: Promise<void>;
}

interface FailedRange {
  range: Range;
  error: any;
}

export function createGenericRangeCache<T>(
  fetchRange: (
    client: ReplayClientInterface,
    range: PointRange,
    cacheValues: (values: T[]) => void,
    cacheError: (error: any) => void
  ) => Promise<void>,
  getExecutionPoint: (value: T) => ExecutionPoint
): RangeCache<T> {
  const pendingRanges: PendingRange<T>[] = [];
  const failedRanges: FailedRange[] = [];
  const subscribers: Set<Subscriber> = new Set();
  const store: RangeStore<T> = {
    cachedRanges: [],
    valuesFromCachedRanges: [],
    pendingRanges: [],
    valuesFromPendingRanges: [],
    subscribe(subscriber: Subscriber) {
      subscribers.add(subscriber);
      return () => {
        subscribers.delete(subscriber);
      };
    },
    notifySubscribers() {
      subscribers.forEach(subscriber => subscriber());
    },
    async fetchMissingRanges(client: ReplayClientInterface, pointRange: PointRange) {
      const requestedRange = pointRangeToRange(pointRange);
      const missingRanges = getMissingRanges(
        requestedRange,
        mergeRanges(store.cachedRanges, store.pendingRanges)
      );

      const failedRange = failedRanges.find(failedRange =>
        missingRanges.some(missingRange => rangeContains(missingRange, failedRange.range))
      );
      if (failedRange) {
        throw failedRange.error;
      }

      missingRanges.forEach(missingRange => {
        const pendingRange: PendingRange<T> = {
          range: missingRange,
          values: [],
        };

        pendingRange.promise = new Promise<void>(async (resolve, reject) => {
          pendingRanges.push(pendingRange);
          store.pendingRanges = mergeRanges(store.pendingRanges, [missingRange]);

          let failed = false;
          function onError(error: any) {
            if (!failed) {
              failed = true;
              failedRanges.push({ range: missingRange, error });
              reject(error);
            }
          }

          try {
            await fetchRange(
              client,
              rangeToPointRange(missingRange),
              values => {
                pendingRange.values = mergeSortedValues(
                  pendingRange.values,
                  sortBy(values, value => BigInt(getExecutionPoint(value))),
                  getExecutionPoint
                );
                store.valuesFromPendingRanges = mergeSortedValues(
                  store.valuesFromPendingRanges,
                  values,
                  getExecutionPoint
                );
                store.notifySubscribers();
              },
              onError
            );
          } catch (error) {
            onError(error);
          }

          pendingRanges.splice(pendingRanges.indexOf(pendingRange), 1);
          store.pendingRanges = pendingRanges.reduce<Range[]>(
            (previous, current) => mergeRanges(previous, [current.range]),
            []
          );
          store.valuesFromPendingRanges = pendingRanges.reduce<T[]>(
            (previous, current) => mergeSortedValues(previous, current.values, getExecutionPoint),
            []
          );

          if (!failed) {
            store.cachedRanges = mergeRanges(store.cachedRanges, [pendingRange.range]);
            store.valuesFromCachedRanges = mergeSortedValues(
              store.valuesFromCachedRanges,
              pendingRange.values,
              getExecutionPoint
            );
          }

          store.notifySubscribers();

          if (!failed) {
            resolve();
          }
        });
      });

      store.notifySubscribers();

      await Promise.all(
        pendingRanges
          .filter(pending => rangesOverlap(pending.range, requestedRange))
          .map(pending => pending.promise)
      );
    },
    getExecutionPoint,
  };

  function getCachedValues(pointRange: PointRange) {
    const range = pointRangeToRange(pointRange);
    return store.valuesFromCachedRanges.filter(value =>
      isInRange(BigInt(store.getExecutionPoint(value)), range)
    );
  }

  function getValuesSuspense(client: ReplayClientInterface, pointRange: PointRange): T[] {
    const range = pointRangeToRange(pointRange);
    const missingRanges = getMissingRanges(
      range,
      mergeRanges(store.cachedRanges, store.pendingRanges)
    );

    const failedRange = failedRanges.find(failedRange =>
      missingRanges.some(missingRange => rangeContains(missingRange, failedRange.range))
    );
    if (failedRange) {
      throw failedRange.error;
    }

    if (
      missingRanges.length > 0 ||
      store.pendingRanges.some(pendingRange => rangesOverlap(pendingRange, range))
    ) {
      throw store.fetchMissingRanges(client, pointRange);
    }

    return getCachedValues(pointRange);
  }

  function getValuesAsync(
    client: ReplayClientInterface,
    pointRange: PointRange
  ): T[] | Promise<T[]> {
    const range = pointRangeToRange(pointRange);
    if (getMissingRanges(range, store.cachedRanges).length > 0) {
      return store.fetchMissingRanges(client, pointRange).then(() => getCachedValues(pointRange));
    }
    return getCachedValues(pointRange);
  }

  return { getValuesSuspense, getValuesAsync, getCachedValues };
}

function mergeSortedValues<T>(
  values1: T[],
  values2: T[],
  getExecutionPoint: (value: T) => ExecutionPoint
) {
  const result: T[] = [];
  let index1 = 0;
  let index2 = 0;
  while (index1 < values1.length && index2 < values2.length) {
    if (BigInt(getExecutionPoint(values1[index1])) < BigInt(getExecutionPoint(values2[index2]))) {
      result.push(values1[index1]);
      index1++;
    } else {
      result.push(values2[index2]);
      index2++;
    }
  }

  if (index1 < values1.length) {
    result.push(...values1.slice(index1));
  } else if (index2 < values2.length) {
    result.push(...values2.slice(index2));
  }

  return result;
}

function pointRangeToRange(pointRange: PointRange): Range {
  return { begin: BigInt(pointRange.begin), end: BigInt(pointRange.end) };
}

function rangeToPointRange(range: Range): PointRange {
  return { begin: String(range.begin), end: String(range.end) };
}
