/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { InspectorAction } from "../actions";
import { initialInspectorState, InspectorState } from "../state";

export const boxModel = require("devtools/client/inspector/boxmodel/reducers/box-model");
export const changes = require("devtools/client/inspector/changes/reducers/changes");
export const classList = require("devtools/client/inspector/rules/reducers/class-list");
import _markup from "devtools/client/inspector/markup/reducers/markup";
export const markup = _markup;
export const pseudoClasses = require("devtools/client/inspector/rules/reducers/pseudo-classes");
export const rules = require("devtools/client/inspector/rules/reducers/rules");

// This ObjectInspector reducer is needed for the Extension Sidebar.
const {
  default: objectInspector,
} = require("devtools/client/debugger/packages/devtools-reps/src/object-inspector/reducer");
export { objectInspector };

export function inspector(
  state: InspectorState = initialInspectorState(),
  action: InspectorAction
): InspectorState {
  switch (action.type) {
    case "set_inspector_3_pane_mode":
      let activeTab = state.activeTab === "ruleview" ? "layoutview" : state.activeTab;
      return { ...state, is3PaneModeEnabled: action.is3PaneModeEnabled, activeTab };
    case "set_active_inspector_tab":
      return { ...state, activeTab: action.activeTab };
    default:
      return state;
  }
}
