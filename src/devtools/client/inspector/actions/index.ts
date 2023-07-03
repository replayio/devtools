import { Action } from "@reduxjs/toolkit";

import { ActiveInspectorTab } from "shared/user-data/GraphQL/config";
import { trackEvent } from "ui/utils/telemetry";

export type SetActiveTabAction = Action<"set_active_inspector_tab"> & {
  activeTab: ActiveInspectorTab;
};
export type InspectorAction = SetActiveTabAction;

export function setActiveTab(activeTab: ActiveInspectorTab): SetActiveTabAction {
  trackEvent("inspector.select_tab", { tab: activeTab });
  return { type: "set_active_inspector_tab", activeTab };
}
