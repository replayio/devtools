/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

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
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { selectSource, selectLocation } from "../actions/sources/select";
import { getEditor, getLocationsInViewport } from "../utils/editor";
import { searchContents } from "./file-search";
import { copyToTheClipboard } from "../utils/clipboard";
import { isFulfilled } from "../utils/async-value";
import { closeQuickOpen } from "../reducers/quick-open";

import { getCodeMirror } from "devtools/client/debugger/src/utils/editor";
import { resizeBreakpointGutter } from "../utils/ui";

export function setPrimaryPaneTab(tabName) {
  return { type: "SET_PRIMARY_PANE_TAB", tabName };
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
        type: "TOGGLE_PANE",
        paneCollapsed: false,
      });
    }

    // Make sure the explorer panel is selected so that the user
    // sees the sources panel.
    if (getSelectedPrimaryPanel(getState()) !== "explorer") {
      dispatch({
        type: "set_selected_primary_panel",
        panel: "explorer",
      });
    }

    if (getSourcesCollapsed(getState())) {
      dispatch({
        type: "TOGGLE_SOURCES",
        sourcesCollapsed: false,
      });
    }
  };
}

export function openSourceLink(sourceId, line, column) {
  return async (dispatch, getState) => {
    const cx = getContext(getState());
    const location = { sourceId, line, column };

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
    dispatch({ type: "TOGGLE_PANE", paneCollapsed: !paneCollapsed });
  };
}

export function toggleSourcesCollapse() {
  return (dispatch, getState) => {
    const sourcesCollapsed = getSourcesCollapsed(getState());
    dispatch({ type: "TOGGLE_SOURCES", sourcesCollapsed: !sourcesCollapsed });
  };
}

export function expandSourcesPane() {
  return dispatch => {
    dispatch({ type: "TOGGLE_SOURCES", sourcesCollapsed: false });
  };
}

export function highlightLineRange(location) {
  return {
    type: "HIGHLIGHT_LINES",
    location,
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
  return { type: "SET_CURSOR_POSITION", cursorPosition };
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
  return { type: "SET_FULLTEXT_SEARCH", query };
}

export function focusFullTextInput(focus) {
  return { type: "FOCUS_FULLTEXT_SEARCH", focus };
}
