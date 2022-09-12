import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";
import { createWakeable } from "../utils/suspense";

export function createGenericCache<TParams extends Array<any>, TValue>(
  fetchValue: (...args: TParams) => Promise<TValue>,
  getCacheKey: (...args: TParams) => string
) {
  const recordMap = new Map<string, Record<TValue>>();

  async function fetchAndStoreValue(
    record: Record<TValue>,
    wakeable: Wakeable<TValue>,
    ...args: TParams
  ) {
    try {
      const value = await fetchValue(...args);

      record.status = STATUS_RESOLVED;
      record.value = value;

      wakeable.resolve(record.value);
    } catch (error) {
      record.status = STATUS_REJECTED;
      record.value = error;

      wakeable.reject(error);
    }
  }

  return {
    getValue(...args: TParams): TValue {
      const cacheKey = getCacheKey(...args);

      let record = recordMap.get(cacheKey);
      if (!record) {
        const wakeable = createWakeable<TValue>();
        record = {
          status: STATUS_PENDING,
          value: wakeable,
        } as Record<TValue>;

        recordMap.set(cacheKey, record);

        fetchAndStoreValue(record, record.value, ...args);
      }

      if (record.status === STATUS_RESOLVED) {
        return record.value;
      } else {
        throw record.value;
      }
    },
  };
}
