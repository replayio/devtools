import { useEffect, useRef, useState } from "react";
import {
  Deferred,
  Record,
  Status,
  createDeferred,
  createPendingRecord,
  createResolvedRecord,
  isPendingRecord,
  isPromiseLike,
  isRejectedRecord,
  isResolvedRecord,
  updateRecordToRejected,
  updateRecordToResolved,
} from "suspense";

import { handleError } from "protocol/utils";

export type SubscribeCallback = (status: Status | undefined) => void;
export type UnsubscribeFromCacheStatusFunction = () => void;

export interface GenericCache<TExtraParams extends Array<any>, TParams extends Array<any>, TValue> {
  addValue(value: TValue, ...args: TParams): void;
  getCacheKey(...args: TParams): string;
  getStatus(...args: TParams): Status | undefined;
  getValueAsync(...args: [...TParams, ...TExtraParams]): PromiseLike<TValue> | TValue;
  getValueIfCached(...args: TParams): { value: TValue } | undefined;
  getValueSuspense(...args: [...TParams, ...TExtraParams]): TValue;
  remove(...args: TParams): void;
  subscribeToStatus: (
    callback: SubscribeCallback,
    ...args: TParams
  ) => UnsubscribeFromCacheStatusFunction;
}

export function createGenericCache<
  TExtraParams extends Array<any>,
  TParams extends Array<any>,
  TValue
>(
  debugLabel: string,
  fetchValue: (...args: [...TParams, ...TExtraParams]) => PromiseLike<TValue> | TValue,
  getCacheKey: (...args: TParams) => string
): GenericCache<TExtraParams, TParams, TValue> {
  const recordMap = new Map<string, Record<TValue>>();
  const subscriberMap = new Map<string, Set<SubscribeCallback>>();

  function getOrCreateRecord(...args: [...TParams, ...TExtraParams]): Record<TValue> {
    const cacheKey = getCacheKey(...(args as unknown as TParams));

    let record = recordMap.get(cacheKey);
    if (!record) {
      const deferred = createDeferred<TValue>(`${debugLabel} ${cacheKey}}`);
      record = createPendingRecord<TValue>(deferred);

      recordMap.set(cacheKey, record);

      notifySubscribers(...(args as unknown as TParams));

      fetchAndStoreValue(record, deferred, ...args).catch(handleError);
    }

    return record;
  }

  function notifySubscribers(...args: TParams) {
    const cacheKey = getCacheKey(...args);
    const set = subscriberMap.get(cacheKey);
    if (set) {
      set.forEach(callback => callback(getStatus(...args)));
    }
  }

  function subscribeToStatus(callback: SubscribeCallback, ...args: TParams) {
    const cacheKey = getCacheKey(...args);
    let set = subscriberMap.get(cacheKey);
    if (set) {
      set.add(callback);
    } else {
      set = new Set([callback]);
      subscriberMap.set(cacheKey, set);
    }

    try {
      const status = getStatus(...args);

      callback(status);
    } finally {
      return () => {
        set!.delete(callback);
        if (set!.size === 0) {
          subscriberMap.delete(cacheKey);
        }
      };
    }
  }

  async function fetchAndStoreValue(
    record: Record<TValue>,
    deferred: Deferred<TValue>,
    ...args: [...TParams, ...TExtraParams]
  ) {
    try {
      const valueOrPromiseLike = fetchValue(...args);
      const value = isPromiseLike(valueOrPromiseLike)
        ? await valueOrPromiseLike
        : valueOrPromiseLike;

      updateRecordToResolved(record, value);

      deferred.resolve(value);
    } catch (error) {
      updateRecordToRejected(record, error);

      deferred.reject(error);
    } finally {
      notifySubscribers(...(args as unknown as TParams));
    }
  }

  function getStatus(...args: TParams) {
    const cacheKey = getCacheKey(...args);
    return recordMap.get(cacheKey)?.data.status;
  }

  return {
    getValueSuspense(...args: [...TParams, ...TExtraParams]): TValue {
      const record = getOrCreateRecord(...args);
      if (isPendingRecord(record)) {
        throw record.data.deferred.promise;
      } else if (isRejectedRecord(record)) {
        throw record.data.error;
      }

      return record.data.value as TValue;
    },

    getValueAsync(...args: [...TParams, ...TExtraParams]): PromiseLike<TValue> | TValue {
      const record = getOrCreateRecord(...args);
      if (isPendingRecord(record)) {
        return record.data.deferred.promise;
      } else if (isRejectedRecord(record)) {
        throw record.data.error;
      }

      return record.data.value as TValue;
    },

    getValueIfCached(...args: TParams): { value: TValue } | undefined {
      const cacheKey = getCacheKey(...args);
      const record = recordMap.get(cacheKey);
      if (record) {
        if (isResolvedRecord(record)) {
          return { value: record.data.value as TValue };
        } else if (isRejectedRecord(record)) {
          throw record.data.error;
        }
      }
    },

    addValue(value: TValue, ...args: TParams) {
      const cacheKey = getCacheKey(...args);
      recordMap.set(cacheKey, createResolvedRecord(value));
    },

    getStatus,

    getCacheKey,

    remove(...args) {
      const cacheKey = getCacheKey(...args);
      recordMap.delete(cacheKey);
    },

    subscribeToStatus,
  };
}

interface HookState<TValue> {
  loading: boolean;
  value?: TValue;
  error?: any;
}
