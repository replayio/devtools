import { SetStateAction, useCallback, useLayoutEffect, useState, useTransition } from "react";

import { localStorageGetItem, localStorageSetItem } from "../utils/storage";

// Forked from https://usehooks.com/useLocalStorage/
export default function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  scheduleUpdatesAsTransitions: boolean = false
): [value: T, setValue: (value: T | ((prevValue: T) => T)) => void, isPending: boolean] {
  const [isPending, startTransition] = useTransition();

  const [value, setValue] = useState<T>(() => {
    const storedValue = localStorageGetItem(key);
    if (storedValue != null) {
      return JSON.parse(storedValue);
    } else {
      return initialValue;
    }
  });

  const setValueWrapper = useCallback(
    (action: SetStateAction<T>) => {
      if (scheduleUpdatesAsTransitions) {
        startTransition(() => {
          setValue(action);
        });
      } else {
        setValue(action);
      }
    },
    [scheduleUpdatesAsTransitions]
  );

  // Listen for changes to this local storage value made from other windows.
  useLayoutEffect(() => {
    const onStorage = () => {
      const newValue = localStorageGetItem(key);
      if (newValue != null) {
        startTransition(() => {
          setValue(JSON.parse(newValue));
        });
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

  return [value, setValueWrapper, isPending];
}
