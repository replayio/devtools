/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { AnyAction } from "@reduxjs/toolkit";

const {
  UPDATE_LAYOUT,
  UPDATE_OFFSET_PARENT,
} = require("devtools/client/inspector/boxmodel/actions/index");

export interface BoxModelState {
  layout: Record<string, unknown>;
  offsetParent: unknown | null;
}

const INITIAL_BOX_MODEL: BoxModelState = {
  layout: {},
  offsetParent: null,
};

module.exports = function (state = INITIAL_BOX_MODEL, action: AnyAction) {
  switch (action.type) {
    case UPDATE_LAYOUT: {
      return {
        ...state,
        layout: action.layout,
      };
    }
    case UPDATE_OFFSET_PARENT: {
      return {
        ...state,
        offsetParent: action.offsetParent,
      };
    }
    default:
      return state;
  }
};
