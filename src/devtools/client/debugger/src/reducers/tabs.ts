/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { AnyAction, createAction } from "@reduxjs/toolkit";
import type { UIState } from "ui/state";

/**
 * Tabs reducer
 * @module reducers/tabs
 */

import { createSelector } from "reselect";

import { isSimilarTab } from "../utils/tabs";
import {
  getSourceDetails,
  getSourceDetailsEntities,
  getSelectedLocation,
  SourceDetails,
  MiniSource,
  locationSelected,
  getSourceIdToDisplayForUrl,
} from "ui/reducers/sources";

export interface Tab {
  sourceId: string | null;
  framework?: string | null;
  isOriginal?: boolean;
  url: string;
}

export interface TabsState {
  tabs: Tab[];
}

export const tabsRestored = createAction<SourceDetails[]>("tabs/tabsRestored");

export const EMPTY_TABS: Tab[] = [];

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

    case tabsRestored.type:
      return addVisibleTabs(state, action.payload);

    case locationSelected.type: {
      return addSelectedSource(state, action.payload.source);
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
  const selectedLocation = getSelectedLocation(state);
  const availableTabs = state.tabs.tabs;
  if (!selectedLocation) {
    return "";
  }

  const selectedTab = getSourceDetails(state, selectedLocation.sourceId);
  if (!selectedTab) {
    return "";
  }

  const matchingTab = availableTabs.find(tab => isSimilarTab(tab, selectedTab.url!));

  if (matchingTab) {
    const selectedSourceId = getSourceIdToDisplayForUrl(state, selectedTab.url!);

    if (selectedSourceId) {
      return selectedSourceId;
    }

    return "";
  }

  const tabUrls = tabList.map(t => t.url);
  const leftNeighborIndex = Math.max(tabUrls.indexOf(selectedTab.url!) - 1, 0);
  const lastAvailbleTabIndex = availableTabs.length - 1;
  const newSelectedTabIndex = Math.min(leftNeighborIndex, lastAvailbleTabIndex);
  const availableTab = availableTabs[newSelectedTabIndex];

  if (availableTab?.sourceId) {
    return availableTab.sourceId;
  }

  return "";
}

function matchesSource(tab: Tab, source: MiniSource) {
  return tab.sourceId === source.id || matchesUrl(tab, source);
}

function matchesUrl(tab: Tab, source: MiniSource) {
  return tab.url === source.url;
}

function addSelectedSource(state: TabsState, source: MiniSource) {
  if (
    state.tabs
      .filter(({ sourceId }) => sourceId)
      .map(({ sourceId }) => sourceId)
      .includes(source.id)
  ) {
    return state;
  }

  return updateTabList(state, {
    url: source.url!,
    sourceId: source.id,
  });
}

function addVisibleTabs(state: TabsState, sources: MiniSource[]) {
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

function removeSourceFromTabList(state: TabsState, { source }: { source: MiniSource }) {
  const { tabs } = state;
  const newTabs = tabs.filter(tab => !matchesSource(tab, source));
  return { tabs: newTabs };
}

function removeSourcesFromTabList(state: TabsState, { sources }: { sources: MiniSource[] }) {
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
    const newTab = { url, sourceId };
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

export const getSourcesForTabs = createSelector(
  getSourceTabs,
  getSourceDetailsEntities,
  (tabs, detailsEntities) => {
    return tabs.map(tab => detailsEntities[tab.sourceId!]!).filter(Boolean);
  }
);

export function getTabExists(state: UIState, sourceId: string) {
  return !!getSourceTabs(state).find(tab => tab.sourceId == sourceId);
}

export default update;
