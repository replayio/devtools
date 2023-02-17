import { useEffect, useRef, useState } from "react";

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
  getValueAsync(...args: [...TExtraParams, ...TParams]): Thennable<TValue> | TValue;
  getValueIfCached(...args: TParams): { value: TValue } | undefined;
  getValueSuspense(...args: [...TExtraParams, ...TParams]): TValue;
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
  fetchValue: (...args: [...TExtraParams, ...TParams]) => Thennable<TValue> | TValue,
  getCacheKey: (...args: TParams) => string
): GenericCache<TExtraParams, TParams, TValue> {
  const recordMap = new Map<string, Record<TValue>>();
  const subscriberMap = new Map<string, Set<SubscribeCallback>>();

  const extraParamsLength = fetchValue.length - getCacheKey.length;

  function getOrCreateRecord(...args: [...TExtraParams, ...TParams]): Record<TValue> {
    const cacheKey = getCacheKey(...(args.slice(extraParamsLength) as TParams));

    let record = recordMap.get(cacheKey);
    if (!record) {
      const wakeable = createWakeable<TValue>(`${debugLabel} ${cacheKey}}`);
      record = {
        status: STATUS_PENDING,
        value: wakeable,
      } as Record<TValue>;

      recordMap.set(cacheKey, record);

      notifySubscribers(...(args.slice(extraParamsLength) as TParams));

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
    ...args: [...TExtraParams, ...TParams]
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
      notifySubscribers(...(args.slice(extraParamsLength) as TParams));
    }
  }

  function getStatus(...args: TParams) {
    const cacheKey = getCacheKey(...args);
    return recordMap.get(cacheKey)?.status;
  }

  return {
    getValueSuspense(...args: [...TExtraParams, ...TParams]): TValue {
      const record = getOrCreateRecord(...args);
      if (record.status === STATUS_RESOLVED) {
        return record.value;
      } else {
        throw record.value;
      }
    },

    getValueAsync(...args: [...TExtraParams, ...TParams]): Thennable<TValue> | TValue {
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

    subscribeToStatus,
  };
}

interface HookState<TValue> {
  loading: boolean;
  value?: TValue;
  error?: any;
}

export function createUseGetValue<TParams extends Array<any>, TValue>(
  getValueAsync: (...args: TParams) => Thennable<TValue> | TValue,
  getValueIfCached: (...args: TParams) => { value: TValue } | undefined,
  getCacheKey: (...args: TParams) => string
): (...args: TParams) => HookState<TValue> {
  return function useGetValue(...args: TParams) {
    const [counter, setCounter] = useState(0);
    const fetchingForKey = useRef<string>();

    let cachedValue: { value: TValue } | undefined;
    let caught: { error: any } | undefined;
    try {
      cachedValue = getValueIfCached(...args);
    } catch (error) {
      caught = { error };
    }

    useEffect(() => {
      const key = getCacheKey(...args);

      if (!cachedValue && !caught) {
        fetchingForKey.current = key;
        // Convince both JS and TS it's safe to call `.then()` here
        Promise.resolve(getValueAsync(...args) as Promise<TValue>).then(
          maybeTriggerRendering,
          maybeTriggerRendering
        );
      }

      function maybeTriggerRendering() {
        if (fetchingForKey.current === key) {
          fetchingForKey.current = undefined;
          setCounter(counter + 1);
        }
      }
    });

    return { loading: !cachedValue && !caught, value: cachedValue?.value, error: caught?.error };
  };
}
