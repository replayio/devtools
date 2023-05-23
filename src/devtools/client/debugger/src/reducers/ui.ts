/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { Location } from "@replayio/protocol";

import { SourceDetails } from "ui/reducers/sources";
import type { UIState } from "ui/state";

import { prefs } from "../utils/prefs";
import { closeQuickOpen } from "./quick-open";
import type { Range } from "./types";

export type ActiveSearchType = "project" | "file";

export type SelectedPrimaryPaneTabType = "sources" | "outline";

export interface HighlightedRange {
  start?: number;
  end?: number;
  sourceId?: string;
}

export interface UISliceState {
  selectedPrimaryPaneTab: SelectedPrimaryPaneTabType;
  activeSearch?: ActiveSearchType | null;
  fullTextSearchQuery: string;
  fullTextSearchFocus: boolean;
  shownSource?: SourceDetails | null;
  sourcesCollapsed: boolean;
  frameworkGroupingOn: boolean;
  viewport?: Range | null;
  cursorPosition?: Location | null;
  highlightedLineRange?: HighlightedRange;
}

const uiSlice = createSlice({
  name: "debuggerUI",
  initialState: (): UISliceState => ({
    selectedPrimaryPaneTab: "sources",
    activeSearch: null,
    fullTextSearchQuery: "",
    fullTextSearchFocus: false,
    shownSource: null,
    sourcesCollapsed: prefs.sourcesCollapsed as boolean,
    frameworkGroupingOn: prefs.frameworkGroupingOn as boolean,
    highlightedLineRange: undefined,
    viewport: null,
    cursorPosition: null,
  }),
  reducers: {
    toggleActiveSearch(state, action: PayloadAction<ActiveSearchType | null>) {
      state.activeSearch = action.payload;
    },
    toggleFrameworkGrouping(state, action: PayloadAction<boolean>) {
      state.frameworkGroupingOn = action.payload;
    },
    setShownSource(state, action: PayloadAction<SourceDetails | null>) {
      state.shownSource = action.payload;
    },
    toggleSources(state) {
      state.sourcesCollapsed = !state.sourcesCollapsed;
    },
    sourcesPanelExpanded(state) {
      state.sourcesCollapsed = false;
    },
    highlightLineRange(state, action: PayloadAction<HighlightedRange>) {
      const { start, end, sourceId } = action.payload;
      let lineRange: HighlightedRange = {};

      if (start && end && sourceId) {
        lineRange = { start, end, sourceId };
      }
      state.highlightedLineRange = lineRange;
    },
    clearHighlightLineRange(state) {
      state.highlightedLineRange = {};
    },
    setPrimaryPaneTab(state, action: PayloadAction<SelectedPrimaryPaneTabType>) {
      state.selectedPrimaryPaneTab = action.payload;
    },
    setFullTextQuery(state, action: PayloadAction<string>) {
      state.fullTextSearchQuery = action.payload;
    },
    focusFullTextInput(state, action: PayloadAction<boolean>) {
      state.fullTextSearchFocus = action.payload;
    },
    closeProjectSearch(state) {
      if (state.activeSearch === "project") {
        state.activeSearch = null;
      }
    },
    setViewport(state, action: PayloadAction<Range | null>) {
      state.viewport = action.payload;
    },
    setCursorPosition(state, action: PayloadAction<Location | null>) {
      state.cursorPosition = action.payload;
    },
    // Need to ensure three pieces of UI are updated:
    // Here: pause info panel is open, sources are open
    // Layout reducer: selected primary panel is "explorer"
    sourcesDisplayed(state) {
      state.sourcesCollapsed = false;
    },
  },
  extraReducers: builder => {
    builder.addCase(closeQuickOpen, state => {
      state.highlightedLineRange = {};
    });
  },
});

export const {
  clearHighlightLineRange,
  closeProjectSearch,
  focusFullTextInput,
  highlightLineRange,
  setCursorPosition,
  setFullTextQuery,
  setPrimaryPaneTab,
  setShownSource,
  setViewport,
  sourcesDisplayed,
  sourcesPanelExpanded,
  toggleActiveSearch,
  toggleFrameworkGrouping,
  toggleSources,
} = uiSlice.actions;

export function closeActiveSearch() {
  return toggleActiveSearch(null);
}

export default uiSlice.reducer;

export const getSelectedPrimaryPaneTab = (state: UIState) => state.ui.selectedPrimaryPaneTab;
export const getActiveSearch = (state: UIState) => state.ui.activeSearch;
export const getFrameworkGroupingState = (state: UIState) => state.ui.frameworkGroupingOn;
export const getShownSource = (state: UIState) => state.ui.shownSource;
export const getSourcesCollapsed = (state: UIState) => state.ui.sourcesCollapsed;
export const getHighlightedLineRange = (state: UIState) => state.ui.highlightedLineRange;
export const getViewport = (state: UIState) => state.ui.viewport;
export const getCursorPosition = (state: UIState) => state.ui.cursorPosition;
export const getFullTextSearchQuery = (state: UIState) => state.ui.fullTextSearchQuery;
export const getFullTextSearchFocus = (state: UIState) => state.ui.fullTextSearchFocus;
