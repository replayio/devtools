/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Sources reducer
 * @module reducers/sources
 */

import { createSelector } from "reselect";
import { getPrettySourceURL, getPlainUrl, getTextAtPosition } from "../utils/source";
import {
  createInitial,
  insertResources,
  updateResources,
  hasResource,
  getResource,
  getMappedResource,
  memoizeResourceShallow,
  makeReduceAllQuery,
} from "../utils/resource";

import { findPosition } from "../utils/breakpoint/breakpointPositions";
import { pending, fulfilled, rejected, asSettled, isFulfilled } from "../utils/async-value";

import { prefs } from "../utils/prefs";

import {
  hasSourceActor,
  getSourceActor,
  getSourceActors,
  getBreakableLinesForSourceActors,
  getSourceActorBreakpointHitCounts,
} from "./source-actors";
import uniq from "lodash/uniq";

export function initialSourcesState() {
  return {
    sources: createInitial(),
    urls: {},
    plainUrls: {},
    content: {},
    actors: {},
    breakpointPositions: {},
    breakableLines: {},
    epoch: 1,
    selectedLocation: undefined,
    pendingSelectedLocation: prefs.pendingSelectedLocation,
    selectedLocationHasScrolled: false,
    chromeAndExtensionsEnabled: prefs.chromeAndExtensionsEnabled,
    focusedItem: null,
    sourcesLoading: true,
  };
}

function update(state = initialSourcesState(), action) {
  let location = null;

  switch (action.type) {
    case "ADD_SOURCE":
      return addSources(state, [action.source]);

    case "ADD_SOURCES":
      return addSources(state, action.sources);

    case "INSERT_SOURCE_ACTORS":
      return insertSourceActors(state, action);

    case "REMOVE_SOURCE_ACTORS":
      return removeSourceActors(state, action);

    case "SET_SELECTED_LOCATION":
      location = {
        ...action.location,
        url: action.source.url,
      };

      if (action.source.url) {
        prefs.pendingSelectedLocation = location;
      }

      return {
        ...state,
        selectedLocation: {
          sourceId: action.source.id,
          ...action.location,
        },
        pendingSelectedLocation: location,
        selectedLocationHasScrolled: false,
      };

    case "SET_VIEWPORT":
      // Interacting with the viewport while the debugger is selected is
      // a scroll action. Ignore viewport events when the debugger is not
      // selected, as CodeMirror will not update properly.
      if (gToolbox.currentTool == "debugger") {
        return {
          ...state,
          selectedLocationHasScrolled: true,
        };
      }
      return state;

    case "CLEAR_SELECTED_LOCATION":
      location = { url: "" };
      prefs.pendingSelectedLocation = location;

      return {
        ...state,
        selectedLocation: null,
        pendingSelectedLocation: location,
      };

    case "SET_PENDING_SELECTED_LOCATION":
      location = {
        url: action.url,
        line: action.line,
        column: action.column,
      };

      prefs.pendingSelectedLocation = location;
      return { ...state, pendingSelectedLocation: location };

    case "LOAD_SOURCE_TEXT":
      return updateLoadedState(state, action);

    case "BLACKBOX":
      if (action.status === "done") {
        const { id, url } = action.source;
        const { isBlackBoxed } = action.value;
        updateBlackBoxList(url, isBlackBoxed);
        return updateBlackboxFlag(state, id, isBlackBoxed);
      }
      break;

    case "SET_ORIGINAL_BREAKABLE_LINES": {
      const { breakableLines, sourceId } = action;
      return {
        ...state,
        breakableLines: {
          ...state.breakableLines,
          [sourceId]: breakableLines,
        },
      };
    }

    case "ADD_BREAKPOINT_POSITIONS": {
      const { source, positions } = action;
      const breakpointPositions = state.breakpointPositions[source.id];

      return {
        ...state,
        breakpointPositions: {
          ...state.breakpointPositions,
          [source.id]: { ...breakpointPositions, ...positions },
        },
      };
    }
    case "NAVIGATE":
      return {
        ...initialSourcesState(),
        epoch: state.epoch + 1,
      };

    case "SET_FOCUSED_SOURCE_ITEM":
      return { ...state, focusedItem: action.item };

    case "SOURCES_LOADED":
      return { ...state, sourcesLoading: false };

    case "BATCH":
      action.updates.forEach(u => (state = update(state, u)));
      return state;
  }

  return state;
}

export const resourceAsSourceBase = memoizeResourceShallow(({ content, ...source }) => source);

const resourceAsSourceWithContent = memoizeResourceShallow(({ content, ...source }) => ({
  ...source,
  content: asSettled(content),
}));

/*
 * Add sources to the sources store
 * - Add the source to the sources store
 * - Add the source URL to the urls map
 */
function addSources(state, sources) {
  state = {
    ...state,
    urls: { ...state.urls },
    plainUrls: { ...state.plainUrls },
  };

  state.sources = insertResources(
    state.sources,
    sources.map(source => ({
      ...source,
      content: null,
    }))
  );

  for (const source of sources) {
    // 1. Update the source url map
    const existing = state.urls[source.url] || [];
    if (!existing.includes(source.id)) {
      state.urls[source.url] = [...existing, source.id];
    }

    // 2. Update the plain url map
    if (source.url) {
      const plainUrl = getPlainUrl(source.url);
      const existingPlainUrls = state.plainUrls[plainUrl] || [];
      if (!existingPlainUrls.includes(source.url)) {
        state.plainUrls[plainUrl] = [...existingPlainUrls, source.url];
      }
    }
  }

  return state;
}

function insertSourceActors(state, action) {
  const { items } = action;
  state = {
    ...state,
    actors: { ...state.actors },
  };

  for (const sourceActor of items) {
    state.actors[sourceActor.source] = [
      ...(state.actors[sourceActor.source] || []),
      sourceActor.id,
    ];
  }

  const scriptActors = items.filter(item => item.introductionType === "scriptElement");
  if (scriptActors.length > 0) {
    const { ...breakpointPositions } = state.breakpointPositions;

    // If new HTML sources are being added, we need to clear the breakpoint
    // positions since the new source is a <script> with new breakpoints.
    for (const { source } of scriptActors) {
      delete breakpointPositions[source];
    }

    state = { ...state, breakpointPositions };
  }

  return state;
}

/*
 * Update sources when the worker list changes.
 * - filter source actor lists so that missing threads no longer appear
 * - NOTE: we do not remove sources for destroyed threads
 */
function removeSourceActors(state, action) {
  const { items } = action;

  const actors = new Set(items.map(item => item.id));
  const sources = new Set(items.map(item => item.source));

  state = {
    ...state,
    actors: { ...state.actors },
  };

  for (const source of sources) {
    state.actors[source] = state.actors[source].filter(id => !actors.has(id));
  }

  return state;
}

/*
 * Update a source's loaded text content.
 */
function updateLoadedState(state, action) {
  const { sourceId } = action;

  // If there was a navigation between the time the action was started and
  // completed, we don't want to update the store.
  if (action.epoch !== state.epoch || !hasResource(state.sources, sourceId)) {
    return state;
  }

  let content;
  if (action.status === "start") {
    content = pending();
  } else if (action.status === "error") {
    content = rejected(action.error);
  } else if (typeof action.value.text === "string") {
    content = fulfilled({
      type: "text",
      value: action.value.text,
      contentType: action.value.contentType,
    });
  }

  return {
    ...state,
    sources: updateResources(state.sources, [
      {
        id: sourceId,
        content,
      },
    ]),
  };
}

/*
 * Update a source when its state changes
 * e.g. the text was loaded, it was blackboxed
 */
function updateBlackboxFlag(state, sourceId, isBlackBoxed) {
  // If there is no existing version of the source, it means that we probably
  // ended up here as a result of an async action, and the sources were cleared
  // between the action starting and the source being updated.
  if (!hasResource(state.sources, sourceId)) {
    // TODO: We may want to consider throwing here once we have a better
    // handle on async action flow control.
    return state;
  }

  return {
    ...state,
    sources: updateResources(state.sources, [
      {
        id: sourceId,
        isBlackBoxed,
      },
    ]),
  };
}

function updateBlackBoxList(url, isBlackBoxed) {
  const tabs = getBlackBoxList();
  const i = tabs.indexOf(url);
  if (i >= 0) {
    if (!isBlackBoxed) {
      tabs.splice(i, 1);
    }
  } else if (isBlackBoxed) {
    tabs.push(url);
  }
  prefs.tabsBlackBoxed = tabs;
}

export function getBlackBoxList() {
  return prefs.tabsBlackBoxed || [];
}

// Selectors

// Unfortunately, it's really hard to make these functions accept just
// the state that we care about and still type it with Flow. The
// problem is that we want to re-export all selectors from a single
// module for the UI, and all of those selectors should take the
// top-level app state, so we'd have to "wrap" them to automatically
// pick off the piece of state we're interested in. It's impossible
// (right now) to type those wrapped functions.

const getSourcesState = state => state.sources;

export function getSourceThreads(state, source) {
  return uniq(getSourceActors(state, state.sources.actors[source.id]).map(actor => actor.thread));
}

export function getSourceInSources(sources, id) {
  return hasResource(sources, id) ? getMappedResource(sources, id, resourceAsSourceBase) : null;
}

export function getSource(state, id) {
  return getSourceInSources(getSources(state), id);
}

export function getSourceFromId(state, id) {
  const source = getSource(state, id);
  if (!source) {
    throw new Error(`source ${id} does not exist`);
  }
  return source;
}

export function getSourceByActorId(state, actorId) {
  if (!hasSourceActor(state, actorId)) {
    return null;
  }

  return getSource(state, getSourceActor(state, actorId).source);
}

export function getSourcesByURLInSources(sources, urls, url) {
  if (!url || !urls[url]) {
    return [];
  }
  return urls[url].map(id => getMappedResource(sources, id, resourceAsSourceBase));
}

export function getSourcesByURL(state, url) {
  return getSourcesByURLInSources(getSources(state), getUrls(state), url);
}

export function getSourceByURL(state, url) {
  const foundSources = getSourcesByURL(state, url);
  return foundSources ? foundSources[0] : null;
}

export function getSpecificSourceByURLInSources(sources, urls, url) {
  const foundSources = getSourcesByURLInSources(sources, urls, url);
  if (foundSources) {
    return foundSources[0];
  }
  return null;
}

export function getSpecificSourceByURL(state, url) {
  return getSpecificSourceByURLInSources(getSources(state), getUrls(state), url);
}

export function getOriginalSourceByURL(state, url) {
  return getSpecificSourceByURL(state, url);
}

export function getGeneratedSourceByURL(state, url) {
  return getSpecificSourceByURL(state, url);
}

export function getGeneratedSource(state, source) {
  if (!source) {
    return null;
  }

  return source;
}

export function getGeneratedSourceById(state, sourceId) {
  return getSourceFromId(state, sourceId);
}

export function getPendingSelectedLocation(state) {
  return state.sources.pendingSelectedLocation;
}

export function getPrettySource(state, id) {
  if (!id) {
    return;
  }

  const source = getSource(state, id);
  if (!source) {
    return;
  }

  return getOriginalSourceByURL(state, getPrettySourceURL(source.url));
}

export function hasPrettySource(state, id) {
  return !!getPrettySource(state, id);
}

export function getSourcesUrlsInSources(state, url) {
  if (!url) {
    return [];
  }

  const plainUrl = getPlainUrl(url);
  return getPlainUrls(state)[plainUrl] || [];
}

export function getHasSiblingOfSameName(state, source) {
  if (!source) {
    return false;
  }

  return getSourcesUrlsInSources(state, source.url).length > 1;
}

const querySourceList = makeReduceAllQuery(resourceAsSourceBase, sources => sources.slice());

export function getSources(state) {
  return state.sources.sources;
}

export function getSourcesEpoch(state) {
  return state.sources.epoch;
}

export function getUrls(state) {
  return state.sources.urls;
}

export function getPlainUrls(state) {
  return state.sources.plainUrls;
}

export function getSourceList(state) {
  return querySourceList(getSources(state));
}

export function getDisplayedSourcesList(state) {
  return Object.values(getDisplayedSources(state)).flatMap(Object.values);
}

export function getExtensionNameBySourceUrl(state, url) {
  const match = getSourceList(state).find(source => source.url && source.url.startsWith(url));
  if (match && match.extensionName) {
    return match.extensionName;
  }
}

export function getSourceCount(state) {
  return getSourceList(state).length;
}

export const getSelectedLocation = createSelector(
  getSourcesState,
  sources => sources.selectedLocation
);

export const getSelectedSource = createSelector(
  getSelectedLocation,
  getSources,
  (selectedLocation, sources) => {
    if (!selectedLocation) {
      return;
    }

    return getSourceInSources(sources, selectedLocation.sourceId);
  }
);

export const getSelectedSourceWithContent = createSelector(
  getSelectedLocation,
  getSources,
  (selectedLocation, sources) => {
    const source = selectedLocation && getSourceInSources(sources, selectedLocation.sourceId);
    return source ? getMappedResource(sources, source.id, resourceAsSourceWithContent) : null;
  }
);
export function getSourceWithContent(state, id) {
  return getMappedResource(state.sources.sources, id, resourceAsSourceWithContent);
}
export function getSourceContent(state, id) {
  const { content } = getResource(state.sources.sources, id);
  return asSettled(content);
}

export function getSelectedSourceId(state) {
  const source = getSelectedSource(state);
  return source && source.id;
}

export function getHitCounts(state) {
  const id = getSelectedSourceId(state);
  return getSourceActorBreakpointHitCounts(state, state.sources.actors[id]);
}

export const getDisplayedSources = createSelector(
  state => state.sources.sources,
  sources => {
    const result = {};

    for (const id in sources.identity) {
      result[id] = getResource(sources, id);
    }

    return result;
  }
);

export function getSourceActorsForSource(state, id) {
  const actors = state.sources.actors[id];
  if (!actors) {
    return [];
  }

  return getSourceActors(state, actors);
}

export function canLoadSource(state, sourceId) {
  // Return false if we know that loadSourceText() will fail if called on this
  // source. This is used to avoid viewing such sources in the debugger.
  const source = getSource(state, sourceId);
  if (!source) {
    return false;
  }

  const actors = getSourceActorsForSource(state, sourceId);
  return actors.length != 0;
}

export function isSourceWithMap(state, id) {
  return getSourceActorsForSource(state, id).some(soureActor => soureActor.sourceMapURL);
}

export function getBreakpointPositions(state) {
  return state.sources.breakpointPositions;
}

export function getBreakpointPositionsForSource(state, sourceId) {
  const positions = getBreakpointPositions(state);
  return positions && positions[sourceId];
}

export function hasBreakpointPositions(state, sourceId) {
  return !!getBreakpointPositionsForSource(state, sourceId);
}

export function getBreakpointPositionsForLine(state, sourceId, line) {
  const positions = getBreakpointPositionsForSource(state, sourceId);
  return positions && positions[line];
}

export function hasBreakpointPositionsForLine(state, sourceId, line) {
  return !!getBreakpointPositionsForLine(state, sourceId, line);
}

export function getBreakpointPositionsForLocation(state, location) {
  const { sourceId } = location;
  const positions = getBreakpointPositionsForSource(state, sourceId);
  return findPosition(positions, location);
}

export function getBreakableLines(state, sourceId) {
  if (!sourceId) {
    return null;
  }
  const source = getSource(state, sourceId);
  if (!source) {
    return null;
  }

  // We pull generated file breakable lines directly from the source actors
  // so that breakable lines can be added as new source actors on HTML loads.
  return getBreakableLinesForSourceActors(state.sourceActors, state.sources.actors[sourceId]);
}

export const getSelectedBreakableLines = createSelector(
  state => {
    const sourceId = getSelectedSourceId(state);
    return sourceId && getBreakableLines(state, sourceId);
  },
  breakableLines => new Set(breakableLines || [])
);

export function isSourceLoadingOrLoaded(state, sourceId) {
  const { content } = getResource(state.sources.sources, sourceId);
  return content !== null;
}

export function selectedLocationHasScrolled(state) {
  return state.sources.selectedLocationHasScrolled;
}

export function getTextAtLocation(state, id, location) {
  const source = getSource(state, id);
  if (!source) {
    return null;
  }

  const content = getSourceContent(state, id);
  if (!content) {
    return null;
  }
  const text = getTextAtPosition(id, content, { ...location, column: 0 });

  return text;
}

export function getSourcesLoading(state) {
  return state.sources.sourcesLoading;
}

export default update;
