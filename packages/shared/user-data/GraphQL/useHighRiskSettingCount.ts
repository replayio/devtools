import { useSyncExternalStore } from "react";

import { config } from "shared/user-data/GraphQL/config";
import { ConfigurablePreference } from "shared/user-data/GraphQL/types";
import { userData } from "shared/user-data/GraphQL/UserData";
import { PREFERENCES } from "ui/components/shared/UserSettingsModal/panels/Advanced";

const HIGH_RISK_PREFERENCES = PREFERENCES.filter(key => {
  const preference = config[key] as ConfigurablePreference;
  return preference.highRisk;
});

export function useHighRiskSettingCount() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function getSnapshot() {
  return HIGH_RISK_PREFERENCES.filter(key => {
    const value = userData.get(key);
    return value === true;
  }).length;
}

function subscribe(onStoreChange: () => void) {
  const unsubscribes = HIGH_RISK_PREFERENCES.map(key => userData.subscribe(key, onStoreChange));
  return () => {
    unsubscribes.forEach(unsubscribe => unsubscribe());
  };
}
