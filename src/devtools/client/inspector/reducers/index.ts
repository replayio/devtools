/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import boxModel from "devtools/client/inspector/boxmodel/reducers/box-model";
import computed from "devtools/client/inspector/computed/reducers";
import markup from "devtools/client/inspector/markup/reducers/markup";
import rules from "devtools/client/inspector/rules/reducers/rules";
import { preferences } from "shared/preferences/Preferences";
import { ActiveInspectorTab } from "shared/preferences/types";

import { InspectorAction } from "../actions";

export { boxModel, computed, markup, rules };

export interface InspectorState {
  activeTab: ActiveInspectorTab;
}

export function initialInspectorState(): InspectorState {
  return {
    activeTab: preferences.get("activeInspectorTab"),
  };
}

export function inspector(
  state: InspectorState = initialInspectorState(),
  action: InspectorAction
): InspectorState {
  switch (action.type) {
    case "set_active_inspector_tab":
      preferences.set("activeInspectorTab", action.activeTab);
      return { ...state, activeTab: action.activeTab };
    default:
      return state;
  }
}
