export interface InspectorState {
  is3PaneModeEnabled: boolean;
  activeTab: string;
}

export function initialInspectorState(): InspectorState {
  return {
    is3PaneModeEnabled: true,
    activeTab: "layoutview",
  };
}
