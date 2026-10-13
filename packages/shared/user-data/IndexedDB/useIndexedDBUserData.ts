import { SetStateAction, useCallback, useEffect } from "react";
import { Status, useCacheMutation, useCacheStatus } from "suspense";

import { indexedDbCache } from "shared/user-data/IndexedDB/cache";
import { IDBOptions } from "shared/user-data/IndexedDB/types";
import { latestIndexedDbCache } from "shared/user-data/IndexedDB/utils";

// Stores value in IndexedDB and synchronizes it between sessions.
//
// See README.md in shared/user-data for when to use this API
export default function useIndexedDBUserData<Value>(options: {
  database: IDBOptions;
  initialValue: Value;
  recordName: string;
  storeName: string;
}): {
  setValue: (value: Value | ((prevValue: Value) => Value)) => void;
  status: Status;
  value: Value;
} {
  const { database, initialValue, recordName, storeName } = options;

  const { mutateAsync: mutateDbAsync } = useCacheMutation(indexedDbCache);
  const { mutateSync: mutateLatestSync } = useCacheMutation(latestIndexedDbCache);

  // This hook is not meant to suspend;
  // Return the value if it's loaded, else return the default.
  const value =
    latestIndexedDbCache.getValueIfCached(database, storeName, recordName) ?? initialValue;

  const status = useCacheStatus(latestIndexedDbCache, database, storeName, recordName);

  useEffect(() => {
    // If the value hasn't been loaded, this will start loading it.
    // useCacheStatus() will ensure we re-render once loading has finished.
    if (typeof window !== "undefined" && typeof window.indexedDB !== "undefined") {
      latestIndexedDbCache.prefetch(database, storeName, recordName);
    }
  }, [database, storeName, recordName]);

  const setValue = useCallback(
    (action: SetStateAction<Value>) => {
      let newValue: Value;
      if (action instanceof Function) {
        newValue = action(value);
      } else {
        newValue = action;
      }

      mutateLatestSync([database, storeName, recordName], newValue);

      mutateDbAsync([database], async () => {
        const dbInstance = await indexedDbCache.readAsync(database);
        dbInstance.put(storeName, newValue, recordName);
        return dbInstance;
      });
    },
    [database, mutateDbAsync, mutateLatestSync, recordName, storeName, value]
  );

  return {
    setValue,
    status,
    value,
  };
}
