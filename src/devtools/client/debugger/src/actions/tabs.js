/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Redux actions for the editor tabs
 * @module actions/tabs
 */

import { getSourceByURL, getSourceTabs, getNewSelectedSourceId } from "../selectors";
import { removeDocument } from "../utils/editor";

import { selectSource } from "./sources";

export function updateTab(source, framework) {
  const { url, id: sourceId } = source;
  const isOriginal = source.isOriginal;

  return {
    framework,
    isOriginal,
    sourceId,
    type: "UPDATE_TAB",
    url,
  };
}

export function addTab(source) {
  const { url, id: sourceId } = source;
  const isOriginal = source.isOriginal;

  return {
    isOriginal,
    sourceId,
    type: "ADD_TAB",
    url,
  };
}

export function moveTab(url, tabIndex) {
  return {
    tabIndex,
    type: "MOVE_TAB",
    url,
  };
}

export function moveTabBySourceId(sourceId, tabIndex) {
  return {
    sourceId,
    tabIndex,
    type: "MOVE_TAB_BY_SOURCE_ID",
  };
}

/**
 * @memberof actions/tabs
 * @static
 */
export function closeTab(cx, source) {
  return (dispatch, getState, { client }) => {
    removeDocument(source.id);

    const tabs = getSourceTabs(getState());
    dispatch({ source, type: "CLOSE_TAB" });

    const sourceId = getNewSelectedSourceId(getState(), tabs);
    dispatch(selectSource(cx, sourceId));
  };
}

/**
 * @memberof actions/tabs
 * @static
 */
export function closeTabs(cx, urls) {
  return (dispatch, getState, { client }) => {
    const sources = urls.map(url => getSourceByURL(getState(), url)).filter(Boolean);

    const tabs = getSourceTabs(getState());
    sources.map(source => removeDocument(source.id));
    dispatch({ sources, type: "CLOSE_TABS" });

    const sourceId = getNewSelectedSourceId(getState(), tabs);
    dispatch(selectSource(cx, sourceId));
  };
}
