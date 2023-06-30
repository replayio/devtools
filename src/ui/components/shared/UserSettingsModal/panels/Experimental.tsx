import { config } from "shared/user-data/GraphQL/config";
import { PreferencesKey } from "shared/user-data/GraphQL/types";
import { BooleanPreference } from "ui/components/shared/UserSettingsModal/components/BooleanPreference";

export const PREFERENCES: PreferencesKey[] = [
  "feature_columnBreakpoints",
  "backend_profileWorkerThreads",
  "backend_enableUnstableQueryCache",
  "backend_disableStableQueryCache",
  "feature_basicProcessingLoadingBar",
  "console_showFiltersByDefault",
  "backend_disableScanDataCache",
  "feature_brokenSourcemapWorkaround",
  "backend_enableRoutines",
  "backend_rerunRoutines",
  "backend_disableRecordingAssetsInDatabase",
  "feature_reactPanel",
  "backend_disableIncrementalSnapshots",
  "backend_disableConcurrentControllerLoading",
];

export function Experimental() {
  return (
    <div className="space-y-6 overflow-auto">
      <div className="flex flex-col space-y-2 p-1">
        {PREFERENCES.map(key => (
          <BooleanPreference key={key} preference={config[key]} preferencesKey={key} />
        ))}
      </div>
    </div>
  );
}
