import { IDBPDatabase, openDB } from "idb";
import { SetStateAction, useCallback, useEffect } from "react";
import { Cache, Status, createCache, useCacheMutation, useCacheStatus } from "suspense";

export interface IDBOptions {
  databaseName: string;
  databaseVersion: number;
  storeNames: string[];
}

export async function preloadIDBInitialValues(
  idbPrefsDatabase: IDBOptions[],
  recordingId?: string
) {
  const idbPrefsPromises: Promise<any>[] = [];
  if (!recordingId) {
    // We don't have a recording ID if it's the library
    return;
  }

  if (recordingId) {
    for (let dbOptions of idbPrefsDatabase) {
      for (let storeName of dbOptions.storeNames) {
        idbPrefsPromises.push(latestIndexedDbCache.readAsync(dbOptions, storeName, recordingId));
      }
    }
  }

  return Promise.all(idbPrefsPromises);
}

export const indexedDbCache: Cache<[dbOptions: IDBOptions], IDBPDatabase> = createCache({
  debugLabel: "IndexedDB",
  getKey: ([dbOptions]) => dbOptions.databaseName + dbOptions.databaseVersion,
  load: async ([dbOptions]) => {
    const { databaseName, databaseVersion, storeNames } = dbOptions;
    const dbInstance = await openDB(databaseName, databaseVersion, {
      upgrade(db) {
        // The callback runs both on initial creation (no DB yet) and on version number change.
        for (let storeName of storeNames) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        }
      },
    });
    return dbInstance;
  },
});

export const latestIndexedDbCache: Cache<
  [dbOptions: IDBOptions, storeName: string, recordName: string],
  any
> = createCache({
  debugLabel: "LatestIndexedDB",
  getKey: ([dbOptions, storeName, recordName]) =>
    dbOptions.databaseName + dbOptions.databaseVersion + storeName + recordName,
  load: async ([dbOptions, storeName, recordName]) => {
    const dbInstance = await indexedDbCache.readAsync(dbOptions);
    return dbInstance.get(storeName, recordName);
  },
});

/**
Stores value in IndexedDB and synchronizes it between sessions.

Consider the following benefits and trade-offs of using this hook vs useLocalStorage:
- IndexedDB is asynchronous which can complicate things when stored values are used during app initialization
- IndexedDB storage limits is typically much larger than local storage because it is based on free disk space (and not a hard limit).
  See: https://tinyurl.com/index-db-storage-limits
- IndexedDB does not have a built-in method for listening to changes, whereas `localStorage` has a `"storage"` event.

***NOTE**: All IDBOptions database definitions used with this hook _must_ be listed in the `IDB_PREFS_DATABASES`
array in both `src/ui/setup/index.ts` and `bvaughn/components/Initializer.tsx`,
so that the initial values can be read async during app bootstrapping.
That way the initial values are available synchronously when this hook first runs and we
can avoid any unnecessary flashes during initial rendering.
 */
export default function useIndexedDB<T>(options: {
  database: IDBOptions;
  initialValue: T;
  recordName: string;
  storeName: string;
}): {
  setValue: (value: T | ((prevValue: T) => T)) => void;
  status: Status;
  value: T;
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
    (action: SetStateAction<T>) => {
      let newValue: T;
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
