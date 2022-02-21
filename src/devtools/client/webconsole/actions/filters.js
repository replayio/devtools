/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { prefs } from "../utils/prefs";

const { getAllFilters } = require("devtools/client/webconsole/selectors/filters");

const {
  FILTER_TEXT_SET,
  FILTER_TOGGLE,
  FILTERS_CLEAR,
  PREFS,
  FILTERS,
} = require("devtools/client/webconsole/constants");

const updatePrefs = (filter, active) => {
  const FILTER_PREF_MAP = {
    error: "filterError",
    warn: "filterWarn",
    info: "filterInfo",
    debug: "filterDebug",
    log: "filterLog",
  };
  const prefKey = FILTER_PREF_MAP[filter];
  prefs[prefKey] = active;
};

export function filterTextSet(text) {
  return ({ dispatch, getState }) => {
    const filtersState = { ...getAllFilters(getState()), text };
    return dispatch({
      type: FILTER_TEXT_SET,
      filtersState,
      text,
    });
  };
}

export function filterToggle(filter) {
  return ({ dispatch, getState }) => {
    const filters = getAllFilters(getState());
    const newValue = !filters[filter];
    const filtersState = { ...filters, [filter]: newValue };

    dispatch({
      type: FILTER_TOGGLE,
      filtersState,
      filter,
    });
    updatePrefs(filter, newValue);
  };
}
