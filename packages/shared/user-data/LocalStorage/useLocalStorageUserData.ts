import { useEffect, useState } from "react";

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

  // Sync changes to local storage
  useEffect(() => {
    const string = JSON.stringify(value);

    localStorageSetItem(key, string);
  }, [key, value]);

  return [value, setValue];
}
