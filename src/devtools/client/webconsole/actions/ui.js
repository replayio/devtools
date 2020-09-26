/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { getAllPrefs } = require("devtools/client/webconsole/selectors/prefs");
const { getAllUi } = require("devtools/client/webconsole/selectors/ui");
const { getMessage } = require("devtools/client/webconsole/selectors/messages");
const { ThreadFront } = require("protocol/thread");

const {
  INITIALIZE,
  PERSIST_TOGGLE,
  PREFS,
  REVERSE_SEARCH_INPUT_TOGGLE,
  SIDEBAR_CLOSE,
  SPLIT_CONSOLE_CLOSE_BUTTON_TOGGLE,
  TIMESTAMPS_TOGGLE,
  WARNING_GROUPS_TOGGLE,
  FILTERBAR_DISPLAY_MODE_SET,
  EDITOR_TOGGLE,
  EDITOR_SET_WIDTH,
  EDITOR_ONBOARDING_DISMISS,
  EAGER_EVALUATION_TOGGLE,
  AUTOCOMPLETE_TOGGLE,
  SET_ZOOMED_REGION,
} = require("devtools/client/webconsole/constants");

function openLink(url, e) {
  return ({ hud }) => {
    return hud.openLink(url, e);
  };
}

function persistToggle() {
  return ({ dispatch, getState, prefsService }) => {
    dispatch({
      type: PERSIST_TOGGLE,
    });
    const uiState = getAllUi(getState());
    prefsService.setBoolPref(PREFS.UI.PERSIST, uiState.persistLogs);
  };
}

function timestampsToggle() {
  return ({ dispatch, getState, prefsService }) => {
    dispatch({
      type: TIMESTAMPS_TOGGLE,
    });
    const uiState = getAllUi(getState());
    prefsService.setBoolPref(PREFS.UI.MESSAGE_TIMESTAMP, uiState.timestampsVisible);
  };
}

function autocompleteToggle() {
  return ({ dispatch, getState, prefsService }) => {
    dispatch({
      type: AUTOCOMPLETE_TOGGLE,
    });
    const prefsState = getAllPrefs(getState());
    prefsService.setBoolPref(PREFS.FEATURES.AUTOCOMPLETE, prefsState.autocomplete);
  };
}

function warningGroupsToggle() {
  return ({ dispatch, getState, prefsService }) => {
    dispatch({
      type: WARNING_GROUPS_TOGGLE,
    });
    const prefsState = getAllPrefs(getState());
    prefsService.setBoolPref(PREFS.FEATURES.GROUP_WARNINGS, prefsState.groupWarnings);
  };
}

function eagerEvaluationToggle() {
  return ({ dispatch, getState, prefsService }) => {
    dispatch({
      type: EAGER_EVALUATION_TOGGLE,
    });
    const prefsState = getAllPrefs(getState());
    prefsService.setBoolPref(PREFS.FEATURES.EAGER_EVALUATION, prefsState.eagerEvaluation);
  };
}

function initialize() {
  return {
    type: INITIALIZE,
  };
}

function sidebarClose() {
  return {
    type: SIDEBAR_CLOSE,
  };
}

function splitConsoleCloseButtonToggle(shouldDisplayButton) {
  return {
    type: SPLIT_CONSOLE_CLOSE_BUTTON_TOGGLE,
    shouldDisplayButton,
  };
}

function editorToggle() {
  return ({ dispatch, getState, prefsService }) => {
    dispatch({
      type: EDITOR_TOGGLE,
    });
    const uiState = getAllUi(getState());
    prefsService.setBoolPref(PREFS.UI.EDITOR, uiState.editor);
  };
}

function editorOnboardingDismiss() {
  return ({ dispatch, prefsService }) => {
    dispatch({
      type: EDITOR_ONBOARDING_DISMISS,
    });
    prefsService.setBoolPref(PREFS.UI.EDITOR_ONBOARDING, false);
  };
}

function setEditorWidth(width) {
  return ({ dispatch, prefsService }) => {
    dispatch({
      type: EDITOR_SET_WIDTH,
      width,
    });
    prefsService.setIntPref(PREFS.UI.EDITOR_WIDTH, width);
  };
}

function reverseSearchInputToggle({ initialValue } = {}) {
  return {
    type: REVERSE_SEARCH_INPUT_TOGGLE,
    initialValue,
  };
}

function filterBarDisplayModeSet(displayMode) {
  return {
    type: FILTERBAR_DISPLAY_MODE_SET,
    displayMode,
  };
}

function timeWarp(executionPoint) {
  return () => {
    ThreadFront.timeWarp(executionPoint);
  };
}

function setZoomedRegion(zoomStartTime, zoomEndTime, scale) {
  return {
    type: SET_ZOOMED_REGION,
    zoomStartTime,
    zoomEndTime,
    scale,
  };
}

module.exports = {
  eagerEvaluationToggle,
  editorOnboardingDismiss,
  editorToggle,
  filterBarDisplayModeSet,
  initialize,
  persistToggle,
  reverseSearchInputToggle,
  setEditorWidth,
  sidebarClose,
  splitConsoleCloseButtonToggle,
  timestampsToggle,
  warningGroupsToggle,
  openLink,
  timeWarp,
  setZoomedRegion,
  autocompleteToggle,
};
