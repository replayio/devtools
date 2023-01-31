import { ExecutionPoint, PointRange } from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";

import { Range, getMissingRanges, isInRange, mergeRanges } from "../utils/range-list";
import { Subscriber, UnsubscribeFunction } from "./SearchCache";
import { Thennable } from "./types";

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

export interface RangeCache<T> {
  getValuesSuspense(client: ReplayClientInterface, range: PointRange): T[];
  getValuesAsync(client: ReplayClientInterface, range: PointRange): Thennable<T[]> | T[];
  getCachedValues(range: PointRange): T[];
}

interface PendingRange<T> {
  range: Range;
  values: T[];
  promise?: Promise<void>;
}

export function createGenericRangeCache<T>(
  fetchRange: (
    client: ReplayClientInterface,
    range: PointRange,
    cacheValues: (values: T[]) => void
  ) => Promise<void>,
  getExecutionPoint: (value: T) => ExecutionPoint
): RangeCache<T> {
  const pendingRanges: PendingRange<T>[] = [];
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

      missingRanges.forEach(missingRange => {
        const pendingRange: PendingRange<T> = {
          range: missingRange,
          values: [],
        };

        async function doFetch() {
          insertPendingRange(pendingRanges, pendingRange);
          store.pendingRanges = mergeRanges(store.pendingRanges, [missingRange]);

          await fetchRange(client, rangeToPointRange(missingRange), (values: T[]) => {
            pendingRange.values = mergeValues(pendingRange.values, values, getExecutionPoint);
            store.valuesFromPendingRanges = mergeValues(
              store.valuesFromPendingRanges,
              values,
              getExecutionPoint
            );
            store.notifySubscribers();
          });

          removePendingRange(pendingRanges, pendingRange);
          store.pendingRanges = pendingRanges.reduce<Range[]>(
            (previous, current) => mergeRanges(previous, [current.range]),
            []
          );
          store.valuesFromPendingRanges = pendingRanges.reduce<T[]>(
            (previous, current) => mergeValues(previous, current.values, getExecutionPoint),
            []
          );
          store.cachedRanges = mergeRanges(store.cachedRanges, [pendingRange.range]);
          store.valuesFromCachedRanges = mergeValues(
            store.valuesFromCachedRanges,
            pendingRange.values,
            getExecutionPoint
          );
          store.notifySubscribers();
        }

        pendingRange.promise = doFetch();
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

  function getValuesSuspense(client: ReplayClientInterface, pointRange: PointRange): T[] {
    const range = pointRangeToRange(pointRange);
    if (getMissingRanges(range, store.cachedRanges).length > 0) {
      throw store.fetchMissingRanges(client, pointRange);
    }
    return store.valuesFromCachedRanges.filter(value =>
      isInRange(BigInt(store.getExecutionPoint(value)), range)
    );
  }

  function getValuesAsync(
    client: ReplayClientInterface,
    pointRange: PointRange
  ): T[] | Promise<T[]> {
    const range = pointRangeToRange(pointRange);
    if (getMissingRanges(range, store.cachedRanges).length > 0) {
      return store
        .fetchMissingRanges(client, pointRange)
        .then(() =>
          store.valuesFromCachedRanges.filter(value =>
            isInRange(BigInt(store.getExecutionPoint(value)), range)
          )
        );
    }
    return store.valuesFromCachedRanges.filter(value =>
      isInRange(BigInt(store.getExecutionPoint(value)), range)
    );
  }

  function getCachedValues(pointRange: PointRange) {
    const range = pointRange ? pointRangeToRange(pointRange) : undefined;
    const cachedValues = store.valuesFromCachedRanges;
    if (!range) {
      return cachedValues;
    }
    return cachedValues.filter(value => isInRange(BigInt(store.getExecutionPoint(value)), range));
  }

  return { getValuesSuspense, getValuesAsync, getCachedValues };
}

function insertPendingRange<T>(existing: PendingRange<T>[], toInsert: PendingRange<T>) {
  let index = existing.findIndex(ra => ra.range.begin > toInsert.range.begin);
  if (index < 0) {
    index = existing.length;
  }
  existing.splice(index, 0, toInsert);
}

function removePendingRange<T>(existing: PendingRange<T>[], toRemove: PendingRange<T>) {
  const index = existing.indexOf(toRemove);
  if (index >= 0) {
    existing.splice(index, 1);
  }
}

export function mergeValues<T>(
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

function rangesOverlap(range1: Range, range2: Range) {
  return range1.end > range2.begin && range1.begin < range2.end;
}
