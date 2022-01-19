import { Action } from "redux";
import { InspectorActiveTab } from "../state";

export type SetActiveTabAction = Action<"set_active_inspector_tab"> & {
  activeTab: InspectorActiveTab;
};
export type InspectorAction = SetActiveTabAction;

export function setActiveTab(activeTab: InspectorActiveTab): SetActiveTabAction {
  return { type: "set_active_inspector_tab", activeTab };
}
