import { config } from "shared/user-data/GraphQL/config";
import { PreferencesKey } from "shared/user-data/GraphQL/types";
import { BooleanPreference } from "ui/components/shared/UserSettingsModal/components/BooleanPreference";

export const PREFERENCES: PreferencesKey[] = [
  "feature_showLogPointPanelAboveLine",
  "backend_sampleAllTraces",
  "global_logTelemetryEvent",
  "feature_protocolTimeline",
  "feature_protocolPanel",
  "backend_newControllerOnRefresh",
  "backend_profileWorkerThreads",
  "backend_disableCache",
  "backend_enableRoutines",
  "backend_rerunRoutines",
  "backend_disableConcurrentControllerLoading",
];

export function Advanced() {
  return (
    <div className="flex flex-col space-y-2 overflow-y-auto p-1">
      {PREFERENCES.map(key => (
        <BooleanPreference key={key} preference={config[key]} preferencesKey={key} />
      ))}
    </div>
  );
}
