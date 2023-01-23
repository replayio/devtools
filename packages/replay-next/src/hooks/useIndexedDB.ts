import { IDBPDatabase, openDB } from "idb";
import { SetStateAction, useCallback, useEffect, useRef, useState, useTransition } from "react";

import { createGenericCache } from "../suspense/createGenericCache";

export interface IDBOptions {
  databaseName: string;
  databaseVersion: number;
  storeNames: string[];
}

const STATUS_INITIALIZATION_COMPLETE = "initialization-complete";
const STATUS_INITIALIZATION_ERRORED = "initialization-errored";
const STATUS_INITIALIZATION_PENDING = "initialization-pending";
const STATUS_UPDATE_PENDING = "update-pending";

type Status =
  | typeof STATUS_INITIALIZATION_PENDING
  | typeof STATUS_INITIALIZATION_COMPLETE
  | typeof STATUS_INITIALIZATION_ERRORED
  | typeof STATUS_UPDATE_PENDING;

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
        idbPrefsPromises.push(getLatestIDBValueAsync(dbOptions, storeName, recordingId));
      }
    }
  }

  return Promise.all(idbPrefsPromises);
}

export const {
  getValueSuspense: getIDBInstanceSuspense,
  getValueAsync: getIDBInstanceAsync,
  getValueIfCached: getIDBInstanceIfCached,
} = createGenericCache<[dbOptions: IDBOptions], IDBPDatabase>(
  "useIndexedDB: getIDBInstance",
  async dbOptions => {
    const { databaseName, databaseVersion, storeNames } = dbOptions;
    // Create a single shared IDB instance for this DB definition
    const dbInstance = await openDB(databaseName, databaseVersion, {
      upgrade(db) {
        // The "upgrade" callback runs both on initial creation (when a DB does not exist),
        // and on version number change.
        for (let storeName of storeNames) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        }
      },
    });
    return dbInstance;
  },
  dbOptions => dbOptions.databaseName + dbOptions.databaseVersion
);

export const {
  getValueSuspense: getLatestIDBValueSuspense,
  getValueAsync: getLatestIDBValueAsync,
  getValueIfCached: getLatestIDBValueIfCached,
  addValue: setLatestIDBValue,
} = createGenericCache<[dbOptions: IDBOptions, storeName: string, recordName: string], any>(
  "MappedLocationCache: getLatestIDBValue",
  async (dbOptions, storeName, recordName) => {
    // Only look up this initial stored value once
    const dbInstance = await getIDBInstanceAsync(dbOptions);
    return dbInstance.get(storeName, recordName);
  },
  (dbOptions, storeName, recordName) =>
    dbOptions.databaseName + dbOptions.databaseVersion + storeName + recordName
);

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
  scheduleUpdatesAsTransitions?: boolean;
  storeName: string;
}): {
  setValue: (value: T | ((prevValue: T) => T)) => void;
  status: Status;
  value: T;
} {
  const { databaseName, databaseVersion, storeNames } = options.database;
  const { initialValue, recordName, scheduleUpdatesAsTransitions = false, storeName } = options;

  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState<T>(() => {
    // In order for persistence to work properly, `getInitialIDBValueAsync` _must_ have been
    // called in an early app entry point (such as `src/ui/setup/index.ts::bootstrapApp()`, or `components/Initializer.tsx`).
    return (
      getLatestIDBValueIfCached(options.database, storeName, recordName)?.value ?? initialValue
    );
  });
  const [status, setStatus] = useState<Status>(STATUS_INITIALIZATION_PENDING);

  const databaseRef = useRef<IDBPDatabase | null>(null);
  const setValueWrapper = useCallback(
    (newValue: T | ((prevValue: T) => T)) => {
      if (scheduleUpdatesAsTransitions) {
        startTransition(() => {
          setValue(newValue);
        });
      } else {
        setValue(newValue);
      }
    },
    [scheduleUpdatesAsTransitions]
  );

  useEffect(() => {
    if (status === "initialization-complete") {
      // Only sync data to IDB after we've finished reading it,
      // to avoid accidentally overwriting with the initial value
      databaseRef.current?.put(storeName, value, recordName);
      // Also overwrite the cached value so that we can synchronously read
      // this if the hook unmounts and remounts in the same session.
      setLatestIDBValue(value, options.database, storeName, recordName);
    }
  }, [value, options.database, recordName, storeName, status]);

  useEffect(() => {
    async function setupDatabaseForHook() {
      if (typeof window !== "undefined" && typeof window.indexedDB !== "undefined") {
        // Save the DB instance so we can sync updates later
        const dbInstance = await getIDBInstanceAsync(options.database);
        databaseRef.current = dbInstance;
        setStatus(STATUS_INITIALIZATION_COMPLETE);
      } else {
        // No IndexedDB available - this might be a local unit test
        setStatus(STATUS_INITIALIZATION_COMPLETE);
      }
    }

    setupDatabaseForHook();
  }, [options.database, databaseName, databaseVersion, recordName, storeName, storeNames]);

  return {
    setValue: setValueWrapper,
    status: isPending ? STATUS_UPDATE_PENDING : status,
    value,
  };
}
