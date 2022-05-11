/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import type { Context } from "devtools/client/debugger/src/reducers/pause";
// @ts-ignore no definition
import { getCodeMirror } from "devtools/client/debugger/src/utils/editor";
import type { UIThunkAction } from "ui/actions";

import { closeQuickOpen } from "../reducers/quick-open";
import {
  clearHighlightLineRange,
  highlightLineRange,
  toggleActiveSearch,
  setPrimaryPaneTab,
  setCursorPosition,
  setViewport,
  sourcesDisplayed,
  sourcesPanelExpanded,
  toggleStartPanel,
  toggleSources,
  ActiveSearchType,
  HighlightedRange,
} from "../reducers/ui";
import {
  getActiveSearch,
  getQuickOpenEnabled,
  getSource,
  getSourceContent,
  getFileSearchQuery,
  selectedLocationHasScrolled,
  getSelectedLocation,
  getContext,
  Source,
} from "../selectors";
import { isFulfilled } from "../utils/async-value";
import { copyToTheClipboard } from "../utils/clipboard";
// @ts-ignore no definition
import { getEditor, getLocationsInViewport } from "../utils/editor";
import { resizeBreakpointGutter } from "../utils/ui";

import { searchContents } from "./file-search";
import { selectSource, selectLocation } from "./sources/select";

export {
  closeActiveSearch,
  highlightLineRange,
  clearHighlightLineRange,
  toggleActiveSearch,
  toggleFrameworkGrouping,
  setPrimaryPaneTab,
  setFulltextQuery,
  focusFullTextInput,
} from "../reducers/ui";

export function setActiveSearch(activeSearch: ActiveSearchType): UIThunkAction {
  return (dispatch, getState) => {
    const activeSearchState = getActiveSearch(getState());
    if (activeSearchState === activeSearch) {
      return;
    }

    if (getQuickOpenEnabled(getState())) {
      dispatch(closeQuickOpen());
    }

    dispatch(toggleActiveSearch(activeSearch));
  };
}

export function updateActiveFileSearch(cx: Context): UIThunkAction {
  return (dispatch, getState) => {
    const isFileSearchOpen = getActiveSearch(getState()) === "file";
    const fileSearchQuery = getFileSearchQuery(getState());
    if (isFileSearchOpen && fileSearchQuery) {
      const editor = getEditor();
      dispatch(searchContents(cx, fileSearchQuery, editor, false));
    }
  };
}

// Preserve existing export names
export const ensureSourcesIsVisible = sourcesDisplayed;
export const togglePaneCollapse = toggleStartPanel;
export const toggleSourcesCollapse = toggleSources;
export const expandSourcesPane = sourcesPanelExpanded;
export const updateCursorPosition = setCursorPosition;

export function openSourceLink(sourceId: string, line: number, column: number): UIThunkAction {
  return async (dispatch, getState) => {
    const cx = getContext(getState());
    const location = { sourceId, line, column };

    dispatch(showSource(cx, sourceId));
    await dispatch(selectSource(cx, sourceId, location));
  };
}

export function showSource(cx: Context, sourceId: string, openSourcesTab = true): UIThunkAction {
  return (dispatch, getState) => {
    const source = getSource(getState(), sourceId);

    if (!source) {
      return;
    }

    dispatch(setPrimaryPaneTab("sources"));
    // @ts-ignore apparently empty options is legal
    dispatch(selectSource(cx, source.id, {}, openSourcesTab));
  };
}

export function flashLineRange(location: HighlightedRange): UIThunkAction {
  return dispatch => {
    dispatch(highlightLineRange(location));
    setTimeout(() => dispatch(clearHighlightLineRange()), 200);
  };
}

export function updateViewport(): UIThunkAction {
  return dispatch => {
    const viewport = getLocationsInViewport(getEditor());
    dispatch(setViewport(viewport));
  };
}

export function copyToClipboard(source: Source): UIThunkAction {
  return (dispatch, getState) => {
    const content = getSourceContent(getState(), source.id);
    if (content && isFulfilled(content) && content.value!.type === "text") {
      copyToTheClipboard(content.value!.value);
    }
  };
}

export function refreshCodeMirror(): UIThunkAction {
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
            // @ts-ignore More location mismatches
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
