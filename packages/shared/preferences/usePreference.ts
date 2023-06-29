import { useCallback, useSyncExternalStore } from "react";

import { config } from "shared/preferences/config";
import { preferences } from "shared/preferences/Preferences";
import { PreferencesKey } from "shared/preferences/types";

export function usePreference<Key extends PreferencesKey>(
  key: Key
): [
  value: (typeof config)[Key]["defaultValue"],
  setValue: (newValue: (typeof config)[Key]["defaultValue"]) => Promise<void>
] {
  const value = useSyncExternalStore(
    onStoreChange => preferences.subscribe(key, onStoreChange),
    () => preferences.get(key),
    () => preferences.get(key)
  );

  const setValue = useCallback(
    async (newValue: (typeof config)[Key]["defaultValue"]) => {
      await preferences.set(key, newValue);
    },
    [key]
  );

  return [value, setValue];
}
