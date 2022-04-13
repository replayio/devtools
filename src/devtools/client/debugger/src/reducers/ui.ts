/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * UI reducer
 * @module reducers/ui
 */

import { prefs } from "../utils/prefs";

export const createUIState = () => ({
  selectedPrimaryPaneTab: "sources",
  activeSearch: null,
  fullTextSearchQuery: "",
  fullTextSearchFocus: false,
  shownSource: null,
  startPanelCollapsed: prefs.startPanelCollapsed,
  endPanelCollapsed: prefs.endPanelCollapsed,
  sourcesCollapsed: prefs.sourcesCollapsed,
  frameworkGroupingOn: prefs.frameworkGroupingOn,
  highlightedLineRange: undefined,
  viewport: null,
  cursorPosition: null,
});

function update(state = createUIState(), action) {
  switch (action.type) {
    case "TOGGLE_ACTIVE_SEARCH": {
      return { ...state, activeSearch: action.value };
    }

    case "TOGGLE_FRAMEWORK_GROUPING": {
      prefs.frameworkGroupingOn = action.value;
      return { ...state, frameworkGroupingOn: action.value };
    }

    case "SHOW_SOURCE": {
      return { ...state, shownSource: action.source };
    }

    case "TOGGLE_PANE": {
      prefs.startPanelCollapsed = action.paneCollapsed;
      return { ...state, startPanelCollapsed: action.paneCollapsed };
    }

    case "set_selected_primary_panel": {
      prefs.startPanelCollapsed = false;
      return { ...state, startPanelCollapsed: false };
    }

    case "TOGGLE_SOURCES": {
      prefs.sourcesCollapsed = action.sourcesCollapsed;
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

export const getSelectedPrimaryPaneTab = state => state.ui.selectedPrimaryPaneTab;
export const getActiveSearch = state => state.ui.activeSearch;
export const getFrameworkGroupingState = state => state.ui.frameworkGroupingOn;
export const getShownSource = state => state.ui.shownSource;
export const getPaneCollapse = state => state.ui.startPanelCollapsed;
export const getSourcesCollapsed = state => state.ui.sourcesCollapsed;
export const getHighlightedLineRange = state => state.ui.highlightedLineRange;
export const getOrientation = state => state.ui.orientation;
export const getViewport = state => state.ui.viewport;
export const getCursorPosition = state => state.ui.cursorPosition;
export const getFullTextSearchQuery = state => state.ui.fullTextSearchQuery;
export const getFullTextSearchFocus = state => state.ui.fullTextSearchFocus;

export default update;
