import { SetStateAction, useCallback, useEffect, useRef, useState, useTransition } from "react";

import {
  getValue as getValueFromIndexedDb,
  setValue as setValueInIndexedDB,
} from "src/utils/database";

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
  databaseName: string;
  databaseVersion?: number;
  initialValue: T;
  recordName: string;
  scheduleUpdatesAsTransitions?: boolean;
  storeName: string;
}): {
  setValue: (value: T) => void;
  status: Status;
  value: T | undefined;
} {
  const {
    databaseName,
    databaseVersion = 1,
    initialValue,
    recordName,
    scheduleUpdatesAsTransitions = false,
    storeName,
  } = options;

  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState<T | undefined>(undefined);
  const [status, setStatus] = useState<Status>(STATUS_INITIALIZATION_PENDING);

  const databaseRef = useRef<IDBDatabase | null>(null);
  const initialValueRef = useRef<T>(initialValue);

  const setValueWrapper = useCallback(
    (value: T) => {
      if (scheduleUpdatesAsTransitions) {
        startTransition(() => {
          setValue(value);
        });
      } else {
        setValue(value);
      }

      const database = databaseRef.current;
      if (database !== null) {
        setValueInIndexedDB(database, recordName, storeName, value);
      }
    },
    [recordName, scheduleUpdatesAsTransitions, storeName]
  );

  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    let cancelled = false;

    const openRequest = indexedDB.open(databaseName, databaseVersion);
    openRequest.onerror = () => {
      console.error("IndexedDB open error:", openRequest.error);
      setStatus(STATUS_INITIALIZATION_ERRORED);
    };
    openRequest.onsuccess = () => {
      if (!cancelled) {
        const database = openRequest.result;

        databaseRef.current = database;

        getValueFromIndexedDb<T>(database, storeName, recordName).then(({ error, value }) => {
          if (!cancelled) {
            if (error) {
              console.error("IndexedDB read error:", error);
              setStatus(STATUS_INITIALIZATION_ERRORED);
            } else {
              const initialValue = initialValueRef.current;
              setValue(value === undefined ? initialValue : value);
              setStatus(STATUS_INITIALIZATION_COMPLETE);
            }
          }
        });
      }
    };
    openRequest.onupgradeneeded = () => {
      console.log("onupgradeneeded");
      // TODO Handle upgrades
    };

    return () => {
      cancelled = true;
    };
  }, [databaseName, databaseVersion, recordName, storeName]);

  return {
    setValue: setValueWrapper,
    status: isPending ? STATUS_UPDATE_PENDING : status,
    value,
  };
}
