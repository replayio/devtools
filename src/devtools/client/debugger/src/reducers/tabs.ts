/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { AnyAction } from "@reduxjs/toolkit";
import { createSelector } from "reselect";
import { getReplaySession } from "ui/setup/prefs";
import type { UIState } from "ui/state";

/**
 * Tabs reducer
 * @module reducers/tabs
 */

import { getRecordingId } from "ui/utils/recording";

import { makeShallowQuery } from "../utils/resource";
import { isSimilarTab } from "../utils/tabs";

import { getSource, getSpecificSourceByURL, getSources, resourceAsSourceBase } from "./sources";
import type { Source } from "./sources";

export interface Tab {
  sourceId: string | null;
  framework?: string | null;
  isOriginal?: boolean;
  url: string;
}

export interface TabsState {
  tabs: Tab[];
}

const EMPTY_TABS: Tab[] = [];

export const getInitialTabsState = async () => {
  const session = await getReplaySession(getRecordingId()!);

  return { tabs: session?.tabs ?? EMPTY_TABS };
};

function initialTabState() {
  return { tabs: [] };
}

function update(state: TabsState = initialTabState(), action: AnyAction) {
  switch (action.type) {
    case "ADD_TAB":
    case "UPDATE_TAB":
      return updateTabList(state, action as any);

    case "MOVE_TAB":
      return moveTabInList(state, action as any);
    case "MOVE_TAB_BY_SOURCE_ID":
      return moveTabInListBySourceId(state, action as any);

    case "CLOSE_TAB":
      return removeSourceFromTabList(state, action as any);

    case "CLOSE_TABS":
      return removeSourcesFromTabList(state, action as any);

    case "ADD_SOURCE":
      return addVisibleTabs(state, [action.source]);

    case "ADD_SOURCES":
      return addVisibleTabs(state, action.sources);

    case "SET_SELECTED_LOCATION": {
      return addSelectedSource(state, action.source);
    }

    default:
      return state;
  }
}

/**
 * Gets the next tab to select when a tab closes. Heuristics:
 * 1. if the selected tab is available, it remains selected
 * 2. if it is gone, the next available tab to the left should be active
 * 3. if the first tab is active and closed, select the second tab
 *
 * @memberof reducers/tabs
 * @static
 */
export function getNewSelectedSourceId(state: UIState, tabList: Tab[]) {
  const selectedLocation = state.sources.selectedLocation;
  const availableTabs = state.tabs.tabs;
  if (!selectedLocation) {
    return "";
  }

  const selectedTab = getSource(state, selectedLocation.sourceId);
  if (!selectedTab) {
    return "";
  }

  const matchingTab = availableTabs.find(tab => isSimilarTab(tab, selectedTab.url!));

  if (matchingTab) {
    const sources = state.sources.sources;
    if (!sources) {
      return "";
    }

    const selectedSource = getSpecificSourceByURL(state, selectedTab.url!);

    if (selectedSource) {
      return selectedSource.id;
    }

    return "";
  }

  const tabUrls = tabList.map(t => t.url);
  const leftNeighborIndex = Math.max(tabUrls.indexOf(selectedTab.url!) - 1, 0);
  const lastAvailbleTabIndex = availableTabs.length - 1;
  const newSelectedTabIndex = Math.min(leftNeighborIndex, lastAvailbleTabIndex);
  const availableTab = availableTabs[newSelectedTabIndex];

  if (availableTab) {
    const tabSource = getSpecificSourceByURL(state, availableTab.url);

    if (tabSource) {
      return tabSource.id;
    }
  }

  return "";
}

function matchesSource(tab: Tab, source: Source) {
  return tab.sourceId === source.id || matchesUrl(tab, source);
}

function matchesUrl(tab: Tab, source: Source) {
  return tab.url === source.url;
}

function addSelectedSource(state: TabsState, source: Source) {
  if (
    state.tabs
      .filter(({ sourceId }) => sourceId)
      .map(({ sourceId }) => sourceId)
      .includes(source.id)
  ) {
    return state;
  }

  return updateTabList(state, {
    sourceId: source.id,
    url: source.url!,
  });
}

function addVisibleTabs(state: TabsState, sources: Source[]) {
  const tabCount = state.tabs.filter(({ sourceId }) => sourceId).length;
  const tabs = state.tabs
    .map(tab => {
      const source = sources.find(src => matchesUrl(tab, src));
      if (!source) {
        return tab;
      }
      return { ...tab, sourceId: source.id };
    })
    .filter(tab => tab.sourceId);

  if (tabs.length == tabCount) {
    return state;
  }

  return { tabs };
}

function removeSourceFromTabList(state: TabsState, { source }: { source: Source }) {
  const { tabs } = state;
  const newTabs = tabs.filter(tab => !matchesSource(tab, source));
  return { tabs: newTabs };
}

function removeSourcesFromTabList(state: TabsState, { sources }: { sources: Source[] }) {
  const { tabs } = state;

  const newTabs = sources.reduce(
    (tabList, source) => tabList.filter(tab => !matchesSource(tab, source)),
    tabs
  );

  return { tabs: newTabs };
}

/**
 * Adds the new source to the tab list if it is not already there
 * @memberof reducers/tabs
 * @static
 */
function updateTabList(state: TabsState, { url, sourceId }: { url: string; sourceId: string }) {
  let { tabs } = state;
  // Set currentIndex to -1 for URL-less tabs so that they aren't
  // filtered by isSimilarTab
  const currentIndex = url ? tabs.findIndex(tab => isSimilarTab(tab, url)) : -1;

  if (currentIndex === -1) {
    const newTab = { sourceId, url };
    tabs = [newTab, ...tabs];
  }

  return { ...state, tabs };
}

// Source: https://github.com/sindresorhus/array-move/blob/main/index.js
function arrayMove(array: any[], fromIndex: number, toIndex: number) {
  let resultArray = array;
  const startIndex = fromIndex < 0 ? array.length + fromIndex : fromIndex;

  if (startIndex >= 0 && startIndex < array.length) {
    const endIndex = toIndex < 0 ? array.length + toIndex : toIndex;

    resultArray = array.slice();

    const [item] = resultArray.splice(fromIndex, 1);
    resultArray.splice(endIndex, 0, item);
  }

  return resultArray;
}

function moveTabInList(
  state: TabsState,
  { url, tabIndex: newIndex }: { url: string; tabIndex: number }
) {
  let { tabs } = state;
  const currentIndex = tabs.findIndex(tab => tab.url == url);
  tabs = arrayMove(tabs, currentIndex, newIndex);
  return { tabs };
}

function moveTabInListBySourceId(
  state: TabsState,
  { sourceId, tabIndex: newIndex }: { sourceId: string; tabIndex: number }
) {
  let { tabs } = state;
  const currentIndex = tabs.findIndex(tab => tab.sourceId == sourceId);
  tabs = arrayMove(tabs, currentIndex, newIndex);
  return { tabs };
}

// Selectors

export const getTabs = (state: UIState) => state?.tabs.tabs ?? EMPTY_TABS;

export const getSourceTabs = createSelector(
  (state: UIState) => state.tabs,
  ({ tabs }) => tabs.filter(tab => tab.sourceId)
);

export const getSourcesForTabs = (state: UIState) => {
  const tabs = getSourceTabs(state);
  const sources = getSources(state);
  return querySourcesForTabs(sources, tabs);
};

const querySourcesForTabs = makeShallowQuery({
  filter: (_, tabs: Tab[]) => tabs.map(({ sourceId }) => sourceId!),
  map: resourceAsSourceBase,
  reduce: items => items,
});

export function tabExists(state: UIState, sourceId: string) {
  return !!getSourceTabs(state).find(tab => tab.sourceId == sourceId);
}

export default update;
