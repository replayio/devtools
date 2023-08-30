import { useLayoutEffect, useRef, useState } from "react";

import { config } from "shared/user-data/LocalStorage/config";
import { PreferencesKey } from "shared/user-data/LocalStorage/types";
import { localStorageGetItem, localStorageSetItem } from "shared/user-data/LocalStorage/utils";

type Config = typeof config;

// Stores value in localStorage; this API mirrors useState
//
// See README.md in shared/user-data for when to use this API
export default function useLocalStorageUserData<Key extends PreferencesKey>(
  key: Key
): [value: Config[Key], setValue: (newValue: Config[Key]) => void] {
  const [value, setValue] = useState<Config[Key]>(() => {
    const storedValue = localStorageGetItem(key);
    if (storedValue != null) {
      return JSON.parse(storedValue);
    } else {
      return config[key];
    }
  });

  const committedValuesRef = useRef<{
    prevValue: string | null;
    value: string;
  }>({
    prevValue: null,
    value: JSON.stringify(value),
  });
  useLayoutEffect(() => {
    committedValuesRef.current.prevValue = committedValuesRef.current.value;
    committedValuesRef.current.value = JSON.stringify(value);
  });

  // Sync changes from local storage
  useLayoutEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (key === event.key && event.newValue && event.newValue !== JSON.stringify(value)) {
        setValue(JSON.parse(event.newValue));
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [key, value]);

  // Sync changes to local storage
  useLayoutEffect(() => {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key,
        newValue: committedValuesRef.current.value || "",
        oldValue: committedValuesRef.current.prevValue || "",
      })
    );

    localStorageSetItem(key, committedValuesRef.current.value);
  }, [key, value]);

  return [value, setValue];
}
