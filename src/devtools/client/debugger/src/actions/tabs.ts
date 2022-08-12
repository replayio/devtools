/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Redux actions for the editor tabs
 * @module actions/tabs
 */

import { UIThunkAction } from "ui/actions";
import type { Context } from "../reducers/pause";

import { removeDocument } from "../utils/editor";
import { selectSource } from "./sources";

import { getSourceTabs, getNewSelectedSourceId } from "../selectors";
import {
  getSourceToDisplayForUrl,
  isOriginalSource,
  MiniSource,
  SourceDetails,
} from "ui/reducers/sources";

export function updateTab(source: SourceDetails, framework: string) {
  const { url, id: sourceId } = source;
  const isOriginal = isOriginalSource(source);

  return {
    type: "UPDATE_TAB",
    url,
    framework,
    isOriginal,
    sourceId,
  };
}

export function moveTab(url: string, tabIndex: number) {
  return {
    type: "MOVE_TAB",
    url,
    tabIndex,
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
    removeDocument(source.id);

    const tabs = getSourceTabs(getState());
    dispatch({ type: "CLOSE_TAB", source });

    const sourceId = getNewSelectedSourceId(getState(), tabs);
    dispatch(selectSource(cx, sourceId));
  };
}

/**
 * @memberof actions/tabs
 * @static
 */
export function closeTabs(cx: Context, urls: string[]): UIThunkAction {
  return (dispatch, getState) => {
    const sources = urls.map(url => getSourceToDisplayForUrl(getState(), url)!).filter(Boolean);

    const tabs = getSourceTabs(getState());
    sources.forEach(source => removeDocument(source.id));
    dispatch({ type: "CLOSE_TABS", sources });

    const sourceId = getNewSelectedSourceId(getState(), tabs);
    dispatch(selectSource(cx, sourceId));
  };
}
