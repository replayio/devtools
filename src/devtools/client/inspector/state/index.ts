const { prefs } = require("devtools/client/inspector/prefs");

export interface InspectorState {
  isVisible: boolean;
  is3PaneModeEnabled: boolean;
  activeTab: string;
}

export function initialInspectorState(): InspectorState {
  return {
    isVisible: false,
    is3PaneModeEnabled: prefs.is3PaneModeEnabled,
    activeTab: prefs.activeTab,
  };
}
