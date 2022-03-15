/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {
  MESSAGES_CLEAR,
  PERSIST_TOGGLE,
  TIMESTAMPS_TOGGLE,
  FILTERBAR_DISPLAY_MODE_SET,
  FILTERBAR_DISPLAY_MODES,
  SET_ZOOMED_REGION,
} = require("devtools/client/webconsole/constants");

const UiState = overrides =>
  Object.freeze(
    Object.assign(
      {
        persistLogs: false,
        timestampsVisible: true,
        reverseSearchInputVisible: false,
        reverseSearchInitialValue: "",
        editor: false,
        editorWidth: null,
        zoomStartTime: 0,
        zoomEndTime: Number.POSITIVE_INFINITY,
        showEditorOnboarding: false,
        filterBarDisplayMode: FILTERBAR_DISPLAY_MODES.WIDE,
      },
      overrides
    )
  );

function ui(state = UiState(), action) {
  switch (action.type) {
    case PERSIST_TOGGLE:
      return { ...state, persistLogs: !state.persistLogs };
    case TIMESTAMPS_TOGGLE:
      return { ...state, timestampsVisible: !state.timestampsVisible };
    case MESSAGES_CLEAR:
      return { ...state };
    case FILTERBAR_DISPLAY_MODE_SET:
      return {
        ...state,
        filterBarDisplayMode: action.displayMode,
      };
    case SET_ZOOMED_REGION:
      return {
        ...state,
        zoomStartTime: action.zoomStartTime,
        zoomEndTime: action.zoomEndTime,
      };
  }

  return state;
}

module.exports = {
  UiState,
  ui,
};
