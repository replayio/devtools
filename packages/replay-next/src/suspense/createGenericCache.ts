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

type CacheRecordStatus = typeof STATUS_PENDING | typeof STATUS_RESOLVED | typeof STATUS_REJECTED;

export interface GenericCache<TParams extends Array<any>, TValue> {
  getValueSuspense(...args: TParams): TValue;
  getValueAsync(...args: TParams): Thennable<TValue> | TValue;
  getValueIfCached(...args: TParams): { value: TValue } | undefined;
  addValue(value: TValue, ...args: TParams): void;
  getStatus(...args: TParams): CacheRecordStatus | undefined;
}

export interface GenericCache2<TExtra, TParams extends Array<any>, TValue> {
  getValueSuspense(extra: TExtra, ...args: TParams): TValue;
  getValueAsync(extra: TExtra, ...args: TParams): Thennable<TValue> | TValue;
  getValueIfCached(...args: TParams): { value: TValue } | undefined;
  addValue(value: TValue, ...args: TParams): void;
  getStatus(...args: TParams): CacheRecordStatus | undefined;
}

interface HookState<TValue> {
  loading: boolean;
  value?: TValue;
  error?: any;
}

export function createGenericCache<TParams extends Array<any>, TValue>(
  debugLabel: string,
  fetchValue: (...args: TParams) => Thennable<TValue> | TValue,
  getCacheKey: (...args: TParams) => string
): GenericCache<TParams, TValue> {
  const cache = createGenericCache2<undefined, TParams, TValue>(
    debugLabel,
    (_, ...args) => fetchValue(...args),
    (...args) => getCacheKey(...args)
  );
  return {
    getValueSuspense: (...args) => cache.getValueSuspense(undefined, ...args),
    getValueAsync: (...args) => cache.getValueAsync(undefined, ...args),
    getValueIfCached: (...args) => cache.getValueIfCached(...args),
    addValue: (value, ...args) => cache.addValue(value, ...args),
    getStatus: (...args) => cache.getStatus(...args),
  };
}

export function createGenericCache2<TExtra, TParams extends Array<any>, TValue>(
  debugLabel: string,
  fetchValue: (extra: TExtra, ...args: TParams) => Thennable<TValue> | TValue,
  getCacheKey: (...args: TParams) => string
): GenericCache2<TExtra, TParams, TValue> {
  const recordMap = new Map<string, Record<TValue>>();

  function getOrCreateRecord(extra: TExtra, ...args: TParams): Record<TValue> {
    const cacheKey = getCacheKey(...args);

    let record = recordMap.get(cacheKey);
    if (!record) {
      const wakeable = createWakeable<TValue>(`${debugLabel} ${cacheKey}}`);
      record = {
        status: STATUS_PENDING,
        value: wakeable,
      } as Record<TValue>;

      recordMap.set(cacheKey, record);

      fetchAndStoreValue(record, record.value, extra, ...args).catch(handleError);
    }

    return record;
  }

  async function fetchAndStoreValue(
    record: Record<TValue>,
    wakeable: Wakeable<TValue>,
    extra: TExtra,
    ...args: TParams
  ) {
    try {
      const valueOrThennable = fetchValue(extra, ...args);
      const value = isThennable(valueOrThennable) ? await valueOrThennable : valueOrThennable;

      record.status = STATUS_RESOLVED;
      record.value = value;

      wakeable.resolve(value);
    } catch (error) {
      record.status = STATUS_REJECTED;
      record.value = error;

      wakeable.reject(error);
    }
  }

  return {
    getValueSuspense(extra: TExtra, ...args: TParams): TValue {
      const record = getOrCreateRecord(extra, ...args);
      if (record.status === STATUS_RESOLVED) {
        return record.value;
      } else {
        throw record.value;
      }
    },

    getValueAsync(extra: TExtra, ...args: TParams): Thennable<TValue> | TValue {
      const record = getOrCreateRecord(extra, ...args);
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

    getStatus(...args: TParams) {
      const cacheKey = getCacheKey(...args);
      return recordMap.get(cacheKey)?.status;
    },
  };
}

export function createUseGetValue<TParams extends Array<any>, TValue>(
  getValueAsync: (...args: TParams) => Promise<TValue>,
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
        getValueAsync(...args).then(maybeTriggerRendering, maybeTriggerRendering);
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
