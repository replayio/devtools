/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UIState } from "ui/state";
/**
 * Quick Open reducer
 * @module reducers/quick-open
 */

import { parseQuickOpenQuery } from "../utils/quick-open";

// Ref: `MODIFIERS` and `parseQuickOpenQuery` in `../utils/quick-open.js`
export type SearchTypes =
  | "sources"
  | "gotoSource"
  | "functions"
  | "variables"
  | "goto"
  | "shortcuts";

export interface QuickOpenState {
  enabled: boolean;
  query: string;
  searchType: SearchTypes;
  showOnlyOpenSources: boolean;
  project: boolean;
}

export const initialQuickOpenState: QuickOpenState = {
  enabled: false,
  query: "",
  searchType: "sources",
  showOnlyOpenSources: false,
  project: false,
};

const quickOpenSlice = createSlice({
  name: "quickOpen",
  initialState: initialQuickOpenState,
  reducers: {
    openQuickOpen(
      state,
      action: PayloadAction<{ query: string; project: boolean; showOnlyOpenSources?: boolean }>
    ) {
      const { project, query, showOnlyOpenSources } = action.payload;
      state.enabled = true;
      state.project = project;
      state.query = query;
      state.searchType = parseQuickOpenQuery(query);
      state.showOnlyOpenSources = showOnlyOpenSources === true;
    },
    closeQuickOpen(state) {
      return initialQuickOpenState;
    },
    setQuickOpenQuery(state, action: PayloadAction<string>) {
      const query = action.payload;
      state.query = query;
      state.searchType = parseQuickOpenQuery(query);
    },
  },
});

export const { closeQuickOpen, openQuickOpen, setQuickOpenQuery } = quickOpenSlice.actions;

export default quickOpenSlice.reducer;

export function getQuickOpenEnabled(state: UIState) {
  return state.quickOpen.enabled;
}
export function getQuickOpenProject(state: UIState) {
  return state.quickOpen.project;
}

export function getShowOnlyOpenSources(state: UIState) {
  return state.quickOpen.showOnlyOpenSources;
}

export function getQuickOpenQuery(state: UIState) {
  return state.quickOpen.query;
}

export function getQuickOpenType(state: UIState) {
  return state.quickOpen.searchType;
}
