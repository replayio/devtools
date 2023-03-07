import { handleError } from "protocol/utils";
import { isThennable } from "shared/proxy/utils";

import { createWakeable } from "../utils/suspense";
import {
  Record,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
  Thennable,
  Wakeable,
} from "./types";

export { STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED } from "./types";

export type CacheRecordStatus =
  | typeof STATUS_PENDING
  | typeof STATUS_RESOLVED
  | typeof STATUS_REJECTED;

export type SubscribeCallback = (status: CacheRecordStatus | undefined) => void;
export type UnsubscribeFromCacheStatusFunction = () => void;

export interface GenericCache<TExtraParams extends Array<any>, TParams extends Array<any>, TValue> {
  addValue(value: TValue, ...args: TParams): void;
  getCacheKey(...args: TParams): string;
  getStatus(...args: TParams): CacheRecordStatus | undefined;
  getValueAsync(...args: [...TParams, ...TExtraParams]): Thennable<TValue> | TValue;
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
  fetchValue: (...args: [...TParams, ...TExtraParams]) => Thennable<TValue> | TValue,
  getCacheKey: (...args: TParams) => string
): GenericCache<TExtraParams, TParams, TValue> {
  const recordMap = new Map<string, Record<TValue>>();
  const subscriberMap = new Map<string, Set<SubscribeCallback>>();

  function getOrCreateRecord(...args: [...TParams, ...TExtraParams]): Record<TValue> {
    const cacheKey = getCacheKey(...(args as unknown as TParams));

    let record = recordMap.get(cacheKey);
    if (!record) {
      const wakeable = createWakeable<TValue>(`${debugLabel} ${cacheKey}}`);
      record = {
        status: STATUS_PENDING,
        value: wakeable,
      } as Record<TValue>;

      recordMap.set(cacheKey, record);

      notifySubscribers(...(args as unknown as TParams));

      fetchAndStoreValue(record, record.value, ...args).catch(handleError);
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
    wakeable: Wakeable<TValue>,
    ...args: [...TParams, ...TExtraParams]
  ) {
    try {
      const valueOrThennable = fetchValue(...args);
      const value = isThennable(valueOrThennable) ? await valueOrThennable : valueOrThennable;

      record.status = STATUS_RESOLVED;
      record.value = value;

      wakeable.resolve(value);
    } catch (error) {
      record.status = STATUS_REJECTED;
      record.value = error;

      wakeable.reject(error);
    } finally {
      notifySubscribers(...(args as unknown as TParams));
    }
  }

  function getStatus(...args: TParams) {
    const cacheKey = getCacheKey(...args);
    return recordMap.get(cacheKey)?.status;
  }

  return {
    getValueSuspense(...args: [...TParams, ...TExtraParams]): TValue {
      const record = getOrCreateRecord(...args);
      if (record.status === STATUS_RESOLVED) {
        return record.value;
      } else {
        throw record.value;
      }
    },

    getValueAsync(...args: [...TParams, ...TExtraParams]): Thennable<TValue> | TValue {
      const record = getOrCreateRecord(...args);
      switch (record.status) {
        case STATUS_PENDING:
        case STATUS_RESOLVED: {
          return record.value;
        }
        case STATUS_REJECTED: {
          throw record.value;
        }
      }
    },

    getValueIfCached(...args: TParams): { value: TValue } | undefined {
      const cacheKey = getCacheKey(...args);
      const record = recordMap.get(cacheKey);
      switch (record?.status) {
        case STATUS_RESOLVED: {
          return { value: record.value };
        }
        case STATUS_REJECTED: {
          throw record.value;
        }
      }
    },

    addValue(value: TValue, ...args: TParams) {
      const cacheKey = getCacheKey(...args);
      recordMap.set(cacheKey, { status: STATUS_RESOLVED, value });
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
