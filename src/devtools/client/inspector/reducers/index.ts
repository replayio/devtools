/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { InspectorAction } from "../actions";
const { prefs } = require("devtools/client/inspector/prefs");

import boxModel from "devtools/client/inspector/boxmodel/reducers/box-model";
import markup from "devtools/client/inspector/markup/reducers/markup";
import rules from "devtools/client/inspector/rules/reducers/rules";
import computed from "devtools/client/inspector/computed/reducers";
export { markup, rules, computed, boxModel };

export type InspectorActiveTab = "ruleview" | "layoutview" | "computedview" | "eventsview";

export interface InspectorState {
  activeTab: InspectorActiveTab;
}

export function initialInspectorState(): InspectorState {
  return {
    activeTab: prefs.activeTab,
  };
}

export function inspector(
  state: InspectorState = initialInspectorState(),
  action: InspectorAction
): InspectorState {
  switch (action.type) {
    case "set_active_inspector_tab":
      prefs.activeTab = action.activeTab;
      return { ...state, activeTab: action.activeTab };
    default:
      return state;
  }
}
