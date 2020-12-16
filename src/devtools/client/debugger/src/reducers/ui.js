/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * UI reducer
 * @module reducers/ui
 */

import { prefs, features } from "../utils/prefs";

export const createUIState = () => ({
  selectedPrimaryPaneTab: "sources",
  activeSearch: null,
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

    case "NAVIGATE": {
      return { ...state, activeSearch: null, highlightedLineRange: {} };
    }

    default: {
      return state;
    }
  }
}

// NOTE: we'd like to have the app state fully typed
// https://github.com/firefox-devtools/debugger/blob/master/src/reducers/sources.js#L179-L185

export function getSelectedPrimaryPaneTab(state) {
  return state.ui.selectedPrimaryPaneTab;
}

export function getActiveSearch(state) {
  return state.ui.activeSearch;
}

export function getFrameworkGroupingState(state) {
  return state.ui.frameworkGroupingOn;
}

export function getShownSource(state) {
  return state.ui.shownSource;
}

export function getPaneCollapse(state) {
  return state.ui.startPanelCollapsed;
}

export function getSourcesCollapsed(state) {
  return state.ui.sourcesCollapsed;
}

export function getHighlightedLineRange(state) {
  return state.ui.highlightedLineRange;
}

export function getOrientation(state) {
  return state.ui.orientation;
}

export function getViewport(state) {
  return state.ui.viewport;
}

export function getCursorPosition(state) {
  return state.ui.cursorPosition;
}

export default update;
