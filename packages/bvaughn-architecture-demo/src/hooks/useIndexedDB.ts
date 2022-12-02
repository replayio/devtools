import { IDBPDatabase, openDB } from "idb";
import { SetStateAction, useCallback, useEffect, useRef, useState, useTransition } from "react";

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

// Stores value in IndexedDB and synchronizes it between sessions.
//
// Consider the following benefits and trade-offs of using this hook vs useLocalStorage:
// * IndexedDB is asynchronous which can complicate things when stored values are used during app initialization
// * IndexedDB storage limits is typically much larger than local storage because it is based on free disk space (and not a hard limit).
//   See: https://tinyurl.com/index-db-storage-limits
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
  const [value, setValue] = useState<T>(initialValue);
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
    }
  }, [value, recordName, storeName, status]);

  useEffect(() => {
    let cancelled = false;

    async function setupDatabaseForHook() {
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
      databaseRef.current = dbInstance;
      try {
        const savedData = await dbInstance.get(storeName, recordName);
        if (!cancelled) {
          if (savedData !== undefined) {
            // We may not have a saved value. Don't overwrite with `undefined`.
            setValue(savedData);
          }
          setStatus(STATUS_INITIALIZATION_COMPLETE);
        }
      } catch {
        setStatus(STATUS_INITIALIZATION_ERRORED);
      }
    }

    setupDatabaseForHook();

    return () => {
      cancelled = true;
      databaseRef.current?.close();
    };
  }, [databaseName, databaseVersion, recordName, storeName, storeNames]);

  return {
    setValue: setValueWrapper,
    status: isPending ? STATUS_UPDATE_PENDING : status,
    value,
  };
}
