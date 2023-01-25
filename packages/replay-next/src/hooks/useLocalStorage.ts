import {
  SetStateAction,
  useCallback,
  useLayoutEffect,
  useReducer,
  useState,
  useTransition,
} from "react";

import { localStorageGetItem, localStorageSetItem } from "../utils/storage";

function manuallyTriggerStorageEvent() {
  // Apparently the "storage" event only fires across tabs, and setting a value
  // in the _same_ tab won't trigger it. Do that manually:
  window.dispatchEvent(new Event("storage"));
}

// Stores value in localStorage and synchronizes it between sessions and tabs.
// The API mirrors useState.
// It can optionally be configured to wrap React updates in a transition.
//
// Consider the following benefits and trade-offs of using this hook vs useIndexedDB:
// * Local storage is synchronous which can simplify things when stored values are used during app initialization
// * Local storage has a hard limit of ~5MB so it should not be used for values that grow over time (e.g. arrays, per-recording values)
export default function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  scheduleUpdatesAsTransitions: boolean = false
): [value: T, setValue: (value: T | ((prevValue: T) => T)) => void, isPending: boolean] {
  const [isPending, startTransition] = useTransition();
  const [updateCounter, dispatchUpdate] = useReducer(c => c + 1, 0);

  // nosemgrep typescript.react.best-practice.react-props-in-state.react-props-in-state
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
          dispatchUpdate();
        });
      } else {
        setValue(action);
        dispatchUpdate();
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

    // Only notify if this hook has had its setter run
    if (updateCounter > 0) {
      // Notify any other components subscribed to this value that it has changed
      manuallyTriggerStorageEvent();
    }
  }, [key, value, updateCounter]);

  return [value, setValueWrapper, isPending];
}
