/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { UIThunkAction } from "ui/actions";

import { prefs } from "../utils/prefs";

import {
  filterTextUpdated,
  filterToggled,
  getAllFilters,
  FilterBooleanFields,
} from "../reducers/filters";

type PrefsKeys = keyof typeof prefs;

type MessageFilters = "error" | "warn" | "info" | "debug" | "log";

const FILTER_PREF_MAP: Record<MessageFilters, PrefsKeys> = {
  error: "filterError",
  warn: "filterWarn",
  info: "filterInfo",
  debug: "filterDebug",
  log: "filterLog",
};

const updatePrefs = (filter: MessageFilters, active: boolean) => {
  const prefKey = FILTER_PREF_MAP[filter];
  // TODO Centralize prefs updates instead of doing in a thunk
  prefs[prefKey] = active;
};

export const filterTextSet = filterTextUpdated;

export function filterToggle(filter: FilterBooleanFields): UIThunkAction {
  return (dispatch, getState) => {
    dispatch(filterToggled(filter));
    const filtersState = getAllFilters(getState());
    const newValue = filtersState[filter];

    // Technically mismatching keys here - the UI does toggle `"nodemodules"`,
    // but we don't have that set up to persist right now
    updatePrefs(filter as MessageFilters, newValue);
  };
}
