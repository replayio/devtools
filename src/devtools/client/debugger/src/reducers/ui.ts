/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { AnyAction } from "@reduxjs/toolkit";
import type { UIState } from "ui/state";

/**
 * UI reducer
 * @module reducers/ui
 */

import { prefs } from "../utils/prefs";
import type { Source } from "./sources";
import type { Location } from "@recordreplay/protocol";
import type { Range } from "./types";

type ActiveSearchType = "project" | "file";

type SelectedPrimaryPaneTabType = "sources" | "outline";

export interface UISliceState {
  selectedPrimaryPaneTab: SelectedPrimaryPaneTabType;
  activeSearch?: ActiveSearchType | null;
  fullTextSearchQuery: string;
  fullTextSearchFocus: boolean;
  shownSource?: Source | null;
  startPanelCollapsed: boolean;
  endPanelCollapsed: boolean;
  sourcesCollapsed: boolean;
  frameworkGroupingOn: boolean;
  viewport?: Range | null;
  cursorPosition?: Location | null;
  highlightedLineRange?: {
    start?: number;
    end?: number;
    sourceId?: number;
  };
}

export const createUIState = (): UISliceState => ({
  selectedPrimaryPaneTab: "sources",
  activeSearch: null,
  fullTextSearchQuery: "",
  fullTextSearchFocus: false,
  shownSource: null,
  startPanelCollapsed: prefs.startPanelCollapsed as boolean,
  endPanelCollapsed: prefs.endPanelCollapsed as boolean,
  sourcesCollapsed: prefs.sourcesCollapsed as boolean,
  frameworkGroupingOn: prefs.frameworkGroupingOn as boolean,
  highlightedLineRange: undefined,
  viewport: null,
  cursorPosition: null,
});

function update(state = createUIState(), action: AnyAction) {
  switch (action.type) {
    case "TOGGLE_ACTIVE_SEARCH": {
      return { ...state, activeSearch: action.value };
    }

    case "TOGGLE_FRAMEWORK_GROUPING": {
      return { ...state, frameworkGroupingOn: action.value };
    }

    case "SHOW_SOURCE": {
      return { ...state, shownSource: action.source };
    }

    case "TOGGLE_PANE": {
      return { ...state, startPanelCollapsed: action.paneCollapsed };
    }

    case "set_selected_primary_panel": {
      return { ...state, startPanelCollapsed: false };
    }

    case "TOGGLE_SOURCES": {
      return { ...state, sourcesCollapsed: action.sourcesCollapsed };
    }

    case "HIGHLIGHT_LINES":
      const { start, end, sourceId } = action.location;
      let lineRange = {};

      if (start && end && sourceId) {
        lineRange = { start, end, sourceId };
      }

      return { ...state, highlightedLineRange: lineRange };

    case "CLOSE_QUICK_OPEN":
    case "CLEAR_HIGHLIGHT_LINES":
      return { ...state, highlightedLineRange: {} };

    case "SET_PRIMARY_PANE_TAB":
      return { ...state, selectedPrimaryPaneTab: action.tabName };

    case "SET_FULLTEXT_SEARCH": {
      return { ...state, fullTextSearchQuery: action.query };
    }

    case "FOCUS_FULLTEXT_SEARCH": {
      return { ...state, fullTextSearchFocus: action.focus };
    }

    case "CLOSE_PROJECT_SEARCH": {
      if (state.activeSearch === "project") {
        return { ...state, activeSearch: null };
      }
      return state;
    }

    case "SET_VIEWPORT": {
      return { ...state, viewport: action.viewport };
    }

    case "SET_CURSOR_POSITION": {
      return { ...state, cursorPosition: action.cursorPosition };
    }

    default: {
      return state;
    }
  }
}

export const getSelectedPrimaryPaneTab = (state: UIState) => state.ui.selectedPrimaryPaneTab;
export const getActiveSearch = (state: UIState) => state.ui.activeSearch;
export const getFrameworkGroupingState = (state: UIState) => state.ui.frameworkGroupingOn;
export const getShownSource = (state: UIState) => state.ui.shownSource;
export const getPaneCollapse = (state: UIState) => state.ui.startPanelCollapsed;
export const getSourcesCollapsed = (state: UIState) => state.ui.sourcesCollapsed;
export const getHighlightedLineRange = (state: UIState) => state.ui.highlightedLineRange;
export const getViewport = (state: UIState) => state.ui.viewport;
export const getCursorPosition = (state: UIState) => state.ui.cursorPosition;
export const getFullTextSearchQuery = (state: UIState) => state.ui.fullTextSearchQuery;
export const getFullTextSearchFocus = (state: UIState) => state.ui.fullTextSearchFocus;

export default update;
