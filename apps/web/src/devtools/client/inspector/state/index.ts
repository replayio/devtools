const { prefs } = require("devtools/client/inspector/prefs");

export interface InspectorState {
  is3PaneModeEnabled: boolean;
  activeTab: string;
}

export function initialInspectorState(): InspectorState {
  return {
    is3PaneModeEnabled: prefs.is3PaneModeEnabled,
    activeTab: prefs.activeTab,
  };
}
