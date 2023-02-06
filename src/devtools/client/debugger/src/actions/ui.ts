/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import type { Context } from "devtools/client/debugger/src/reducers/pause";
import { copyToClipboard as copyTextToClipboard } from "replay-next/components/sources/utils/clipboard";
import { getSourceContentsIfCached } from "replay-next/src/suspense/SourcesCache";
import type { UIThunkAction } from "ui/actions";
import { SourceDetails, getSourceDetails } from "ui/reducers/sources";

import { closeQuickOpen } from "../reducers/quick-open";
import {
  ActiveSearchType,
  HighlightedRange,
  clearHighlightLineRange,
  highlightLineRange,
  setCursorPosition,
  setPrimaryPaneTab,
  sourcesDisplayed,
  sourcesPanelExpanded,
  toggleActiveSearch,
  toggleSources,
} from "../reducers/ui";
import { getActiveSearch, getContext, getQuickOpenEnabled } from "../selectors";
import { selectSource } from "./sources/select";

export {
  closeActiveSearch,
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

// Preserve existing export names
export const ensureSourcesIsVisible = sourcesDisplayed;
export const toggleSourcesCollapse = toggleSources;
export const expandSourcesPane = sourcesPanelExpanded;
export const updateCursorPosition = setCursorPosition;

export function openSourceLink(sourceId: string, line?: number, column?: number): UIThunkAction {
  return async (dispatch, getState) => {
    const cx = getContext(getState());
    const location = { sourceId, line, column };

    dispatch(showSource(cx, sourceId));
    await dispatch(selectSource(cx, sourceId, location));
  };
}

export function showSource(cx: Context, sourceId: string, openSource = true): UIThunkAction {
  return (dispatch, getState) => {
    const source = getSourceDetails(getState(), sourceId);

    if (!source) {
      return;
    }

    dispatch(setPrimaryPaneTab("sources"));
    // @ts-ignore apparently empty options is legal
    dispatch(selectSource(cx, source.id, {}, openSource));
  };
}

export function flashLineRange(location: HighlightedRange): UIThunkAction {
  return dispatch => {
    dispatch(highlightLineRange(location));
    setTimeout(() => dispatch(clearHighlightLineRange()), 200);
  };
}

export function copyToClipboard(source: SourceDetails): UIThunkAction {
  return (dispatch, getState, { replayClient }) => {
    const sourceContents = getSourceContentsIfCached(source.id);

    if (typeof sourceContents?.value?.contents === "string") {
      copyTextToClipboard(sourceContents.value.contents);
    }
  };
}
