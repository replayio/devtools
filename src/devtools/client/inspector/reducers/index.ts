/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { InspectorAction } from "../actions";
import { initialInspectorState, InspectorState } from "../state";
const { prefs } = require("devtools/client/inspector/prefs");

export const boxModel = require("devtools/client/inspector/boxmodel/reducers/box-model");
export const changes = require("devtools/client/inspector/changes/reducers/changes");
import classList from "devtools/client/inspector/rules/reducers/class-list";
import markup from "devtools/client/inspector/markup/reducers/markup";
import eventTooltip from "devtools/client/inspector/markup/reducers/eventTooltip";
import rules from "devtools/client/inspector/rules/reducers/rules";
import computed from "devtools/client/inspector/computed/reducers";
export { classList, markup, eventTooltip, rules, computed };

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
