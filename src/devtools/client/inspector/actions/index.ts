import { Action } from "redux";
import { InspectorActiveTab } from "../state";

export type Set3PaneModeAction = Action<"set_inspector_3_pane_mode"> & {
  is3PaneModeEnabled: boolean;
};
export type SetActiveTabAction = Action<"set_active_inspector_tab"> & {
  activeTab: InspectorActiveTab;
};
export type InspectorAction = Set3PaneModeAction | SetActiveTabAction;

export function set3PaneMode(is3PaneModeEnabled: boolean): Set3PaneModeAction {
  return { type: "set_inspector_3_pane_mode", is3PaneModeEnabled };
}

export function setActiveTab(activeTab: InspectorActiveTab): SetActiveTabAction {
  return { type: "set_active_inspector_tab", activeTab };
}
