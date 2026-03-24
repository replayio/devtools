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
];

export function Advanced() {
  return (
    <div className="flex min-h-0 flex-1 flex-col divide-y divide-border overflow-y-auto">
      {PREFERENCES.map(key => (
        <div key={key} className="py-3 first:pt-0 last:pb-0">
          <BooleanPreference preference={config[key]} preferencesKey={key} />
        </div>
      ))}
    </div>
  );
}
