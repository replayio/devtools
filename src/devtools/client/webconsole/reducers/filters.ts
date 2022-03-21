/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { createSlice, createNextState, PayloadAction } from "@reduxjs/toolkit";

import type { UIState } from "ui/state";

// @ts-ignore
import constants from "devtools/client/webconsole/constants";

// Matches the fields in `DEFAULT_FILTERS_VALUES`
export interface WebconsoleFiltersState {
  text: string;
  error: boolean;
  warn: boolean;
  log: boolean;
  info: boolean;
  debug: boolean;
  css: boolean;
  net: boolean;
  nodemodules: boolean;
}

export type FilterBooleanFields = Exclude<keyof WebconsoleFiltersState, "text">;

// Already defined in `constants.js`, and don't want to duplicate for now
const initialFiltersState: WebconsoleFiltersState = constants.DEFAULT_FILTERS_VALUES;

export const FilterState = (overrides: Partial<WebconsoleFiltersState> = {}) => {
  return createNextState(initialFiltersState, draft => {
    Object.assign(draft, overrides);
  });
};

const filtersSlice = createSlice({
  name: "filters",
  initialState: initialFiltersState,
  reducers: {
    filterToggled(state, action: PayloadAction<FilterBooleanFields>) {
      state[action.payload] = !state[action.payload];
    },
    filterTextUpdated(state, action: PayloadAction<string>) {
      state.text = action.payload;
    },
  },
});

export const { filterTextUpdated, filterToggled } = filtersSlice.actions;

export const filters = filtersSlice.reducer;

export function getAllFilters(state: UIState) {
  return state.filters;
}
