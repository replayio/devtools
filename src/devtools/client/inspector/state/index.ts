const { prefs } = require("devtools/client/inspector/prefs");

export type InspectorActiveTab = "ruleview" | "layoutview" | "computedview" | "eventsview";

export interface InspectorState {
  activeTab: InspectorActiveTab;
}

export function initialInspectorState(): InspectorState {
  return {
    activeTab: prefs.activeTab,
  };
}
