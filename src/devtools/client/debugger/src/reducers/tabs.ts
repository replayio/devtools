/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { AnyAction, createAction } from "@reduxjs/toolkit";
import { createSelector } from "reselect";

import {
  MiniSource,
  SourceDetails,
  getSelectedLocation,
  getSourceDetailsEntities,
  locationSelected,
} from "ui/reducers/sources";
import type { UIState } from "ui/state";

/**
 * Tabs reducer
 * @module reducers/tabs
 */

export interface Tab {
  sourceId: string;
  url: string;
}

export interface TabsState {
  tabs: Tab[];
}

export const tabsRestored = createAction<SourceDetails[]>("tabs/tabsRestored");

export const EMPTY_TABS: Tab[] = [];

function initialTabState() {
  return { tabs: EMPTY_TABS };
}

function update(state: TabsState = initialTabState(), action: AnyAction) {
  switch (action.type) {
    case "ADD_TAB":
    case "UPDATE_TAB":
      return updateTabList(state, action as any);

    case "MOVE_TAB_BY_SOURCE_ID":
      return moveTabInListBySourceId(state, action as any);

    case "CLOSE_TAB":
      return removeSourceFromTabList(state, action as any);

    case "CLOSE_TABS":
      return removeSourcesFromTabList(state, action as any);

    case tabsRestored.type:
      return updateSourceIds(state, action.payload);

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
export function getNewSelectedSourceId(state: UIState, tabListBeforeClosing: Tab[]) {
  const selectedLocation = getSelectedLocation(state);
  if (!selectedLocation) {
    return;
  }

  const availableTabs = getTabs(state);
  if (availableTabs.some(tab => tab.sourceId === selectedLocation.sourceId)) {
    return selectedLocation.sourceId;
  }

  const leftNeighborIndex = Math.max(
    tabListBeforeClosing.findIndex(tab => tab.sourceId === selectedLocation.sourceId) - 1,
    0
  );
  const lastAvailbleTabIndex = availableTabs.length - 1;
  const newSelectedTabIndex = Math.min(leftNeighborIndex, lastAvailbleTabIndex);
  const availableTab = availableTabs[newSelectedTabIndex];

  return availableTab?.sourceId;
}

function addSelectedSource(state: TabsState, source: MiniSource) {
  if (state.tabs.some(tab => tab.sourceId === source.id)) {
    return state;
  }

  return updateTabList(state, {
    url: source.url!,
    sourceId: source.id,
  });
}

function updateSourceIds(state: TabsState, sources: MiniSource[]) {
  const tabCount = state.tabs.filter(({ sourceId }) => sourceId).length;
  const tabs = state.tabs
    .map(tab => {
      const source = sources.find(src => tab.url === src.url);
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
  const newTabs = tabs.filter(tab => tab.sourceId !== source.id);
  return { tabs: newTabs };
}

function removeSourcesFromTabList(state: TabsState, { sources }: { sources: MiniSource[] }) {
  const { tabs } = state;
  const newTabs = tabs.filter(tab => !sources.some(source => tab.sourceId === source.id));
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
  const currentIndex = tabs.findIndex(tab => tab.sourceId === sourceId);

  if (currentIndex === -1) {
    const newTab = { url, sourceId };
    tabs = [newTab, ...tabs];
    return { ...state, tabs };
  }

  return state;
}

// Source: https://github.com/sindresorhus/array-move/blob/main/index.js
function arrayMove<T>(array: T[], fromIndex: number, toIndex: number): T[] {
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

export const getSourcesForTabs = createSelector(
  getTabs,
  getSourceDetailsEntities,
  (tabs, detailsEntities) => {
    return tabs.map(tab => detailsEntities[tab.sourceId]!).filter(Boolean);
  }
);

export function getTabExists(state: UIState, sourceId: string) {
  return !!getTabs(state).find(tab => tab.sourceId == sourceId);
}

export default update;
