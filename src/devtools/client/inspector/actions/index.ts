import { Action } from "redux";
import { trackEvent } from "ui/utils/telemetry";

import { InspectorActiveTab } from "../state";

export type SetActiveTabAction = Action<"set_active_inspector_tab"> & {
  activeTab: InspectorActiveTab;
};
export type InspectorAction = SetActiveTabAction;

export function setActiveTab(activeTab: InspectorActiveTab): SetActiveTabAction {
  trackEvent("inspector.select_tab", { tab: activeTab });
  return { activeTab, type: "set_active_inspector_tab" };
}
