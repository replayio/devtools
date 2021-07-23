/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { getAllFilters } = require("devtools/client/webconsole/selectors/filters");

const {
  FILTER_TEXT_SET,
  FILTER_TOGGLE,
  FILTERS_CLEAR,
  PREFS,
  FILTERS,
} = require("devtools/client/webconsole/constants");

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
  return ({ dispatch, getState, prefsService }) => {
    const filters = getAllFilters(getState());
    const filtersState = { ...filters, [filter]: !filters[filter] };

    dispatch({
      type: FILTER_TOGGLE,
      filtersState,
      filter,
    });

    prefsService.setBoolPref(PREFS.FILTER[filter.toUpperCase()], filtersState[filter]);
  };
}

export function filterUpdate(filter, value) {
  return ({ dispatch, getState, prefsService }) => {
    const filters = getAllFilters(getState());
    const filtersState = { ...filters, [filter]: value };

    dispatch({
      type: FILTER_TOGGLE,
      filtersState,
      filter,
    });

    prefsService.setBoolPref(PREFS.FILTER[filter.toUpperCase()], filtersState[filter]);
  };
}

export function filtersClear() {
  return ({ dispatch, getState, prefsService }) => {
    const filtersState = getAllFilters(getState());

    dispatch({
      type: FILTERS_CLEAR,
      filtersState,
    });

    for (const filter in filtersState) {
      if (filter !== FILTERS.TEXT) {
        prefsService.clearUserPref(PREFS.FILTER[filter.toUpperCase()]);
      }
    }
  };
}
