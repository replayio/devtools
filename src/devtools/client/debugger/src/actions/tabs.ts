/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Redux actions for the editor tabs
 * @module actions/tabs
 */

import { sourcesByIdCache, sourcesByUrlCache } from "replay-next/src/suspense/SourcesCache";
import { getSourceToDisplayForUrl } from "replay-next/src/utils/sources";
import { UIThunkAction } from "ui/actions";
import { MiniSource, SourceDetails, clearSelectedLocation } from "ui/reducers/sources";

import type { Context } from "../reducers/pause";
import { getNewSelectedSourceId, getTabs } from "../selectors";
import { selectSource } from "./sources";

export function updateTab(source: SourceDetails, framework: string) {
  const { url, id: sourceId } = source;
  const isOriginal = source.isSourceMapped;

  return {
    type: "UPDATE_TAB",
    url,
    framework,
    isOriginal,
    sourceId,
  };
}

export function moveTabBySourceId(sourceId: string, tabIndex: number) {
  return {
    type: "MOVE_TAB_BY_SOURCE_ID",
    sourceId,
    tabIndex,
  };
}

/**
 * @memberof actions/tabs
 * @static
 */
export function closeTab(cx: Context, source: MiniSource): UIThunkAction {
  return (dispatch, getState) => {
    const tabs = getTabs(getState());
    dispatch({ type: "CLOSE_TAB", source });

    const sourceId = getNewSelectedSourceId(getState(), tabs);
    if (sourceId) {
      dispatch(selectSource(cx, sourceId));
    } else {
      dispatch(clearSelectedLocation());
    }
  };
}

/**
 * @memberof actions/tabs
 * @static
 */
export function closeTabs(cx: Context, urls: string[]): UIThunkAction {
  return (dispatch, getState, { replayClient }) => {
    const sourcesById = sourcesByIdCache.getValueIfCached(replayClient);
    const sourcesByUrl = sourcesByUrlCache.getValueIfCached(replayClient);
    if (!sourcesById || !sourcesByUrl) {
      return;
    }
    const sources = urls
      .map(url => getSourceToDisplayForUrl(sourcesById, sourcesByUrl, url))
      .filter(Boolean);

    const tabs = getTabs(getState());
    dispatch({ type: "CLOSE_TABS", sources });

    const sourceId = getNewSelectedSourceId(getState(), tabs);
    if (sourceId) {
      dispatch(selectSource(cx, sourceId));
    } else {
      dispatch(clearSelectedLocation());
    }
  };
}
