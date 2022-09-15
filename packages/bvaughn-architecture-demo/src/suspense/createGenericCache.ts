import { handleError } from "protocol/utils";
import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";
import { createWakeable } from "../utils/suspense";

export interface GenericCache<TParams extends Array<any>, TValue> {
  getValueSuspense(...args: TParams): TValue;
  getValueAsync(...args: TParams): Promise<TValue>;
  getValueIfCached(...args: TParams): TValue | undefined;
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

    getValueIfCached(...args: TParams): TValue | undefined {
      const cacheKey = getCacheKey(...args);
      let record = recordMap.get(cacheKey);
      switch (record?.status) {
        case STATUS_RESOLVED: {
          return record.value;
        }
        case STATUS_REJECTED: {
          throw record.value;
        }
      }
    },
  };
}
