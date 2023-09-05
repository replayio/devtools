/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import computed from "devtools/client/inspector/computed/reducers";
import markup from "devtools/client/inspector/markup/reducers/markup";
import { ActiveInspectorTab } from "shared/user-data/GraphQL/config";
import { userData } from "shared/user-data/GraphQL/UserData";

import { InspectorAction } from "../actions";

export { computed, markup };

export interface InspectorState {
  activeTab: ActiveInspectorTab;
}

export function initialInspectorState(): InspectorState {
  return {
    activeTab: userData.get("inspector_activeTab"),
  };
}

export function inspector(
  state: InspectorState = initialInspectorState(),
  action: InspectorAction
): InspectorState {
  switch (action.type) {
    case "set_active_inspector_tab":
      userData.set("inspector_activeTab", action.activeTab);
      return { ...state, activeTab: action.activeTab };
    default:
      return state;
  }
}
