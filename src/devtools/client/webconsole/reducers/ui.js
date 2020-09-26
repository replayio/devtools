/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {
  INITIALIZE,
  MESSAGES_CLEAR,
  PERSIST_TOGGLE,
  REVERSE_SEARCH_INPUT_TOGGLE,
  SHOW_OBJECT_IN_SIDEBAR,
  SIDEBAR_CLOSE,
  SPLIT_CONSOLE_CLOSE_BUTTON_TOGGLE,
  TIMESTAMPS_TOGGLE,
  FILTERBAR_DISPLAY_MODE_SET,
  FILTERBAR_DISPLAY_MODES,
  EDITOR_ONBOARDING_DISMISS,
  EDITOR_TOGGLE,
  EDITOR_SET_WIDTH,
  SET_ZOOMED_REGION,
} = require("devtools/client/webconsole/constants");

const UiState = overrides =>
  Object.freeze(
    Object.assign(
      {
        initialized: false,
        persistLogs: false,
        sidebarVisible: false,
        timestampsVisible: true,
        frontInSidebar: null,
        closeButtonVisible: true,
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
    case SIDEBAR_CLOSE:
      return {
        ...state,
        sidebarVisible: false,
        frontInSidebar: null,
      };
    case INITIALIZE:
      return { ...state, initialized: true };
    case MESSAGES_CLEAR:
      return { ...state, sidebarVisible: false, frontInSidebar: null };
    case SHOW_OBJECT_IN_SIDEBAR:
      if (action.front === state.frontInSidebar) {
        return state;
      }
      return { ...state, sidebarVisible: true, frontInSidebar: action.front };
    case SPLIT_CONSOLE_CLOSE_BUTTON_TOGGLE:
      return { ...state, closeButtonVisible: action.shouldDisplayButton };
    case REVERSE_SEARCH_INPUT_TOGGLE:
      return {
        ...state,
        reverseSearchInputVisible: !state.reverseSearchInputVisible,
        reverseSearchInitialValue: action.initialValue || "",
      };
    case FILTERBAR_DISPLAY_MODE_SET:
      return {
        ...state,
        filterBarDisplayMode: action.displayMode,
      };
    case EDITOR_TOGGLE:
      return {
        ...state,
        editor: !state.editor,
      };
    case EDITOR_ONBOARDING_DISMISS:
      return {
        ...state,
        showEditorOnboarding: false,
      };
    case EDITOR_SET_WIDTH:
      return {
        ...state,
        editorWidth: action.width,
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
