/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { getCodeMirror } from "devtools/client/debugger/src/utils/editor";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";

import { selectSource, selectLocation } from "../actions/sources/select";
import { closeQuickOpen } from "../reducers/quick-open";
import {
  getActiveSearch,
  getPaneCollapse,
  getSourcesCollapsed,
  getQuickOpenEnabled,
  getSource,
  getSourceContent,
  getFileSearchQuery,
  selectedLocationHasScrolled,
  getSelectedLocation,
  getContext,
} from "../selectors";
import { isFulfilled } from "../utils/async-value";
import { copyToTheClipboard } from "../utils/clipboard";
import { getEditor, getLocationsInViewport } from "../utils/editor";
import { resizeBreakpointGutter } from "../utils/ui";

import { searchContents } from "./file-search";

export function setPrimaryPaneTab(tabName) {
  return { tabName, type: "SET_PRIMARY_PANE_TAB" };
}

export function closeActiveSearch() {
  return {
    type: "TOGGLE_ACTIVE_SEARCH",
    value: null,
  };
}

export function setActiveSearch(activeSearch) {
  return (dispatch, getState) => {
    const activeSearchState = getActiveSearch(getState());
    if (activeSearchState === activeSearch) {
      return;
    }

    if (getQuickOpenEnabled(getState())) {
      dispatch(closeQuickOpen());
    }

    dispatch({
      type: "TOGGLE_ACTIVE_SEARCH",
      value: activeSearch,
    });
  };
}

export function updateActiveFileSearch(cx) {
  return (dispatch, getState) => {
    const isFileSearchOpen = getActiveSearch(getState()) === "file";
    const fileSearchQuery = getFileSearchQuery(getState());
    if (isFileSearchOpen && fileSearchQuery) {
      const editor = getEditor();
      dispatch(searchContents(cx, fileSearchQuery, editor, false));
    }
  };
}

export function toggleFrameworkGrouping(toggleValue) {
  return (dispatch, getState) => {
    dispatch({
      type: "TOGGLE_FRAMEWORK_GROUPING",
      value: toggleValue,
    });
  };
}

export function ensureSourcesIsVisible() {
  return (dispatch, getState) => {
    // Make sure the explorer/pause information panel is open so that the user
    // sees those panels
    if (getPaneCollapse(getState())) {
      dispatch({
        paneCollapsed: false,
        type: "TOGGLE_PANE",
      });
    }

    // Make sure the explorer panel is selected so that the user
    // sees the sources panel.
    if (getSelectedPrimaryPanel(getState()) !== "explorer") {
      dispatch({
        panel: "explorer",
        type: "set_selected_primary_panel",
      });
    }

    if (getSourcesCollapsed(getState())) {
      dispatch({
        sourcesCollapsed: false,
        type: "TOGGLE_SOURCES",
      });
    }
  };
}

export function openSourceLink(sourceId, line, column) {
  return async (dispatch, getState) => {
    const cx = getContext(getState());
    const location = { column, line, sourceId };

    dispatch(showSource(cx, sourceId));
    await dispatch(selectSource(cx, sourceId, location));
  };
}

export function showSource(cx, sourceId, openSourcesTab = true) {
  return (dispatch, getState) => {
    const source = getSource(getState(), sourceId);

    if (!source) {
      return;
    }

    dispatch(setPrimaryPaneTab("sources"));
    dispatch(selectSource(cx, source.id, {}, openSourcesTab));
  };
}

export function togglePaneCollapse() {
  return (dispatch, getState) => {
    const paneCollapsed = getPaneCollapse(getState());
    dispatch({ paneCollapsed: !paneCollapsed, type: "TOGGLE_PANE" });
  };
}

export function toggleSourcesCollapse() {
  return (dispatch, getState) => {
    const sourcesCollapsed = getSourcesCollapsed(getState());
    dispatch({ sourcesCollapsed: !sourcesCollapsed, type: "TOGGLE_SOURCES" });
  };
}

export function expandSourcesPane() {
  return dispatch => {
    dispatch({ sourcesCollapsed: false, type: "TOGGLE_SOURCES" });
  };
}

export function highlightLineRange(location) {
  return {
    location,
    type: "HIGHLIGHT_LINES",
  };
}

export function flashLineRange(location) {
  return dispatch => {
    dispatch(highlightLineRange(location));
    setTimeout(() => dispatch(clearHighlightLineRange()), 200);
  };
}

export function clearHighlightLineRange() {
  return {
    type: "CLEAR_HIGHLIGHT_LINES",
  };
}

export function updateViewport() {
  return {
    type: "SET_VIEWPORT",
    viewport: getLocationsInViewport(getEditor()),
  };
}

export function updateCursorPosition(cursorPosition) {
  return { cursorPosition, type: "SET_CURSOR_POSITION" };
}

export function copyToClipboard(source) {
  return (dispatch, getState) => {
    const content = getSourceContent(getState(), source.id);
    if (content && isFulfilled(content) && content.value.type === "text") {
      copyToTheClipboard(content.value.value);
    }
  };
}

export function refreshCodeMirror() {
  return (dispatch, getState) => {
    // CodeMirror does not update properly when it is hidden. This method has
    // a few workarounds to get the editor to behave as expected when switching
    // to the debugger from another panel and the selected location has changed.
    const codeMirror = getCodeMirror();

    if (!codeMirror) {
      return;
    }

    // Update CodeMirror by dispatching a resize event to the window. CodeMirror
    // also has a refresh() method but it did not work as expected when testing.
    window.dispatchEvent(new Event("resize"));

    // After CodeMirror refreshes, scroll it to the selected location, unless
    // the user explicitly scrolled the editor since the location was selected.
    // In this case the editor will already be in the correct state, and we
    // don't want to undo the scrolling which the user did.
    const handler = () => {
      codeMirror.off("refresh", handler);
      setTimeout(() => {
        const hasScrolled = selectedLocationHasScrolled(getState());
        if (!hasScrolled) {
          const location = getSelectedLocation(getState());
          const cx = getContext(getState());

          if (location) {
            dispatch(selectLocation(cx, location));
          }
        }
        resizeBreakpointGutter(codeMirror);
        codeMirror.refresh();
      }, 0);
    };
    codeMirror.on("refresh", handler);
  };
}

export function setFullTextQuery(query) {
  return { query, type: "SET_FULLTEXT_SEARCH" };
}

export function focusFullTextInput(focus) {
  return { focus, type: "FOCUS_FULLTEXT_SEARCH" };
}
