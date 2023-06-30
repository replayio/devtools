import { useCallback, useSyncExternalStore } from "react";

import { config } from "shared/user-data/GraphQL/config";
import { PreferencesKey } from "shared/user-data/GraphQL/types";
import { userData } from "shared/user-data/GraphQL/UserData";

// See README.md in shared/user-data for when to use this API
export function useGraphQLUserData<Key extends PreferencesKey>(
  key: Key
): [
  value: (typeof config)[Key]["defaultValue"],
  setValue: (newValue: (typeof config)[Key]["defaultValue"]) => Promise<void>
] {
  const value = useSyncExternalStore(
    onStoreChange => userData.subscribe(key, onStoreChange),
    () => userData.get(key),
    () => userData.get(key)
  );

  const setValue = useCallback(
    async (newValue: (typeof config)[Key]["defaultValue"]) => {
      await userData.set(key, newValue);
    },
    [key]
  );

  return [value, setValue];
}
