import { config } from "shared/user-data/GraphQL/config";
import { PreferencesKey } from "shared/user-data/GraphQL/types";
import { BooleanPreference } from "ui/components/shared/UserSettingsModal/components/BooleanPreference";

export const PREFERENCES: PreferencesKey[] = [
  "global_logTelemetryEvent",
  "feature_protocolTimeline",
  "feature_protocolPanel",
  "backend_newControllerOnRefresh",
  "protocol_chromiumRepaints",
];

export function Advanced() {
  return (
    <div className="flex flex-col space-y-2 p-1">
      {PREFERENCES.map(key => (
        <BooleanPreference key={key} preference={config[key]} preferencesKey={key} />
      ))}
    </div>
  );
}
