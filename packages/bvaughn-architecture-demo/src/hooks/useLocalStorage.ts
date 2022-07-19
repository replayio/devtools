import { useCallback, useLayoutEffect, useState } from "react";

// Forked from https://usehooks.com/useLocalStorage/
export default function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: T | ((prevValue: T) => T)) => void] {
  const getValueFromLocalStorage = useCallback(() => {
    try {
      const item = localStorage.getItem(key);
      if (item != null) {
        return JSON.parse(item);
      }
    } catch (error) {
      console.log(error);
    }

    if (typeof initialValue === "function") {
      return (initialValue as any)();
    } else {
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<any>(getValueFromLocalStorage);

  const setValue = useCallback(
    (value: T | ((prevValue: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? (value as any)(storedValue) : value;
        setStoredValue(valueToStore);

        try {
          localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {}

        // Notify listeners that this setting has changed.
        window.dispatchEvent(new Event(key));
      } catch (error) {
        console.log(error);
      }
    },
    [key, storedValue]
  );

  // Listen for changes to this local storage value made from other windows.
  useLayoutEffect(() => {
    const onStorage = (event: StorageEvent) => {
      const newValue = getValueFromLocalStorage();
      if (key === event.key && storedValue !== newValue) {
        setValue(newValue);
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [getValueFromLocalStorage, key, storedValue, setValue]);

  return [storedValue, setValue];
}
