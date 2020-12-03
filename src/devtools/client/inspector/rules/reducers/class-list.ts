/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createReducer, ReducerObject } from "../../shared/reducer-object";
import { ClassListAction } from "../actions/class-list";
import { ClassListState } from "../state/class-list";

const INITIAL_CLASS_LIST: ClassListState = {
  // An array of objects containing the CSS class state that is applied to the current
  // element.
  classes: [],
  // Whether or not the class list panel is expanded.
  isClassPanelExpanded: false,
};

const reducers: ReducerObject<ClassListState, ClassListAction> = {
  ["UPDATE_CLASSES"](classList, { classes }) {
    return {
      ...classList,
      classes: [...classes],
    };
  },

  ["UPDATE_CLASS_PANEL_EXPANDED"](classList, { isClassPanelExpanded }) {
    return {
      ...classList,
      isClassPanelExpanded,
    };
  },
};

export default createReducer(INITIAL_CLASS_LIST, reducers);
