/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { getAllUi } = require("devtools/client/webconsole/selectors/ui");

const {
  PERSIST_TOGGLE,
  PREFS,
  TIMESTAMPS_TOGGLE,
  FILTERBAR_DISPLAY_MODE_SET,
  SET_ZOOMED_REGION,
  TOGGLE_FILTER_DRAWER,
  SET_FILTER_DRAWER,
} = require("devtools/client/webconsole/constants");

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

function filterBarDisplayModeSet(displayMode) {
  return {
    type: FILTERBAR_DISPLAY_MODE_SET,
    displayMode,
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

function toggleFilterDrawer() {
  return { type: TOGGLE_FILTER_DRAWER };
}

function setFilterDrawer(collapsed) {
  return { type: SET_FILTER_DRAWER, collapsed };
}

module.exports = {
  filterBarDisplayModeSet,
  persistToggle,
  timestampsToggle,
  toggleFilterDrawer,
  setFilterDrawer,
  setZoomedRegion,
};
