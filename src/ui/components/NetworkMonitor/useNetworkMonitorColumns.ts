import { useLayoutEffect, useRef, useState } from "react";

import { localStorageGetItem, localStorageSetItem } from "shared/user-data/LocalStorage/utils";

export type ColumnConfig = typeof columnNames;
export type ColumnName = keyof ColumnConfig;
export type EnabledColumns = {
  [key in ColumnName]: boolean;
};

const LOCAL_STORAGE_KEY = "enabledNetworkMonitorColumns";

export function useNetworkMonitorColumns(): [
  enabledColumns: EnabledColumns,
  setEnabledColumns: (enabledColumns: EnabledColumns) => void
] {
  const [enabledColumns, setEnabledColumns] = useState<EnabledColumns>(() => {
    try {
      const storedValue = localStorageGetItem(LOCAL_STORAGE_KEY);
      if (storedValue != null) {
        return JSON.parse(storedValue) as any;
      }
    } catch (error) {}

    return DEFAULT_ENABLED_COLUMNS;
  });

  const committedValuesRef = useRef<{
    prevValue: string | null;
    value: string;
  }>({
    prevValue: null,
    value: JSON.stringify(enabledColumns),
  });
  useLayoutEffect(() => {
    committedValuesRef.current.prevValue = committedValuesRef.current.value;
    committedValuesRef.current.value = JSON.stringify(enabledColumns);
  });

  // Sync changes from local storage
  useLayoutEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === LOCAL_STORAGE_KEY &&
        event.newValue &&
        event.newValue !== JSON.stringify(enabledColumns)
      ) {
        setEnabledColumns(JSON.parse(event.newValue) as any);
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [enabledColumns]);

  // Sync changes to local storage
  useLayoutEffect(() => {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: LOCAL_STORAGE_KEY,
        newValue: committedValuesRef.current.value || "",
        oldValue: committedValuesRef.current.prevValue || "",
      })
    );

    localStorageSetItem(LOCAL_STORAGE_KEY, committedValuesRef.current.value);
  }, [enabledColumns]);

  return [enabledColumns, setEnabledColumns];
}

export const columnNames = {
  domain: "Domain",
  method: "Method",
  name: "Name",
  path: "Path",
  status: "Status",
  type: "Type",
  url: "URL",
};

const DEFAULT_ENABLED_COLUMNS: EnabledColumns = {
  domain: true,
  method: true,
  name: true,
  path: false,
  status: true,
  type: true,
  url: false,
};
