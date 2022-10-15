import { useLayoutEffect, useState } from "react";

import { localStorageGetItem, localStorageSetItem } from "../utils/storage";

// Forked from https://usehooks.com/useLocalStorage/
export default function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: T | ((prevValue: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    const storedValue = localStorageGetItem(key);

    if (storedValue != null) {
      return JSON.parse(storedValue);
    } else {
      return initialValue;
    }
  });

  // Listen for changes to this local storage value made from other windows.
  useLayoutEffect(() => {
    const onStorage = () => {
      const newValue = localStorageGetItem(key);
      if (newValue != null) {
        setValue(JSON.parse(newValue));
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [key]);

  // Sync changes to local storage
  useLayoutEffect(() => {
    const string = JSON.stringify(value);

    localStorageSetItem(key, string);
  }, [key, value]);

  return [value, setValue];
}
