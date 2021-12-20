const { prefs } = require("devtools/client/inspector/prefs");

export type InspectorActiveTab = "ruleview" | "layoutview" | "computedview" | "eventlistenersview";

export interface InspectorState {
  is3PaneModeEnabled: boolean;
  activeTab: InspectorActiveTab;
}

export function initialInspectorState(): InspectorState {
  return {
    is3PaneModeEnabled: prefs.is3PaneModeEnabled,
    activeTab: prefs.activeTab,
  };
}
