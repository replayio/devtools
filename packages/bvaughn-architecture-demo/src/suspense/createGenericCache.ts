import { useEffect, useRef, useState } from "react";

import { handleError } from "protocol/utils";

import { createWakeable } from "../utils/suspense";
import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";

export interface GenericCache<TParams extends Array<any>, TValue> {
  getValueSuspense(...args: TParams): TValue;
  getValueAsync(...args: TParams): Promise<TValue>;
  getValueIfCached(...args: TParams): { value: TValue } | undefined;
}

interface HookState<TValue> {
  loading: boolean;
  value?: TValue;
  error?: any;
}

export function createGenericCache<TParams extends Array<any>, TValue>(
  fetchValue: (...args: TParams) => Promise<TValue>,
  getCacheKey: (...args: TParams) => string
): GenericCache<TParams, TValue> {
  const recordMap = new Map<string, Record<TValue>>();

  function getOrCreateRecord(...args: TParams): Record<TValue> {
    const cacheKey = getCacheKey(...args);

    let record = recordMap.get(cacheKey);
    if (!record) {
      const wakeable = createWakeable<TValue>();
      record = {
        status: STATUS_PENDING,
        value: wakeable,
      } as Record<TValue>;

      recordMap.set(cacheKey, record);

      fetchAndStoreValue(record, record.value, ...args).catch(handleError);
    }

    return record;
  }

  async function fetchAndStoreValue(
    record: Record<TValue>,
    wakeable: Wakeable<TValue>,
    ...args: TParams
  ) {
    try {
      const value = await fetchValue(...args);

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
    getValueSuspense(...args: TParams): TValue {
      const record = getOrCreateRecord(...args);
      if (record.status === STATUS_RESOLVED) {
        return record.value;
      } else {
        throw record.value;
      }
    },

    async getValueAsync(...args: TParams): Promise<TValue> {
      const record = getOrCreateRecord(...args);
      switch (record.status) {
        case STATUS_PENDING: {
          return await record.value;
        }
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
