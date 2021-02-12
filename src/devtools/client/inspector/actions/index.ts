import { Action } from "redux";

export type SetVisibleAction = Action<"set_inspector_visible"> & { visible: boolean };
export type Set3PaneModeAction = Action<"set_inspector_3_pane_mode"> & {
  is3PaneModeEnabled: boolean;
};
export type SetActiveTabAction = Action<"set_active_inspector_tab"> & { activeTab: string };
export type InspectorAction = SetVisibleAction | Set3PaneModeAction | SetActiveTabAction;

export function setVisible(visible: boolean): SetVisibleAction {
  return { type: "set_inspector_visible", visible };
}

export function set3PaneMode(is3PaneModeEnabled: boolean): Set3PaneModeAction {
  return { type: "set_inspector_3_pane_mode", is3PaneModeEnabled };
}

export function setActiveTab(activeTab: string): SetActiveTabAction {
  return { type: "set_active_inspector_tab", activeTab };
}
