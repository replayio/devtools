import type { AnyAction, Action } from "@reduxjs/toolkit";
import { Location } from "@replayio/protocol";
import uniq from "lodash/uniq";
import { createSelector } from "reselect";
import {
  getPossibleBreakpointsForSelectedSource,
  getPossibleBreakpointsForSource,
} from "ui/reducers/possibleBreakpoints";
import type { UIState } from "ui/state";

import { pending, fulfilled, rejected, asSettled } from "../utils/async-value";
import { findPosition } from "../utils/breakpoint/breakpointPositions";
import { prefs } from "../utils/prefs";
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
import type { ResourceState, ResourceId } from "../utils/resource/core";
import { getPrettySourceURL, getPlainUrl, getTextAtPosition } from "../utils/source";

import { hasSourceActor, getSourceActor, getSourceActors, SourceActor } from "./source-actors";
import { SourceLocation } from "./types";

// export type Source = never;
/*
export interface SourceContentValue {
  contentType: string;
  type: string;
  value: string;
}
export interface SourceContent {
  state: "pending" | "fulfilled" | "rejected";
  value?: SourceContentValue;
}

export interface Source {
  // TODO Fix this when `async-value` gets updated
  content?: SourceContent | null;
  extensionName?: string | null;
  id: string;
  introductionType?: string | null;
  introductionUrl?: string | null;
  isBlackBoxed: boolean;
  isExtension: boolean;
  isOriginal: boolean;
  isPrettyPrinted: boolean;
  relativeUrl?: string;
  url?: string;
}

export type SourceResources = ResourceState<Source>;
*/

// Several types TBD here
export interface SourcesState {
  /*
  sources: SourceResources;
  urls: Record<string, ResourceId[]>;
  plainUrls: Record<string, string[]>;
  content: Record<string, unknown>;
  actors: Record<string, string[]>;
  breakableLines: Record<string, number[]>;
  epoch: number;
  selectedLocation?: (Location & { sourceUrl: string }) | null;
  pendingSelectedLocation?: Location & { sourceUrl: string; url?: string };
  selectedLocationHasScrolled: boolean;
  // DEAD
  chromeAndExtensionsEnabled: boolean;
  focusedItem: unknown;
  sourcesLoading: boolean;
  */
}

export interface HitCount {
  location: Location;
  hits: number;
}

export function initialSourcesState(): SourcesState {
  return {
    sources: createInitial(),
    urls: {},
    plainUrls: {},
    content: {},
    actors: {},
    epoch: 1,
    selectedLocation: undefined,
    // @ts-ignore
    pendingSelectedLocation: prefs.pendingSelectedLocation,
    selectedLocationHasScrolled: false,
    // @ts-ignore
    chromeAndExtensionsEnabled: prefs.chromeAndExtensionsEnabled,
    focusedItem: null,
    sourcesLoading: true,
  };
}

function update(state = initialSourcesState(), action: AnyAction) {
  /*
  let location = null;


  switch (action.type) {
    case "ADD_SOURCE":
      return addSources(state, [action.source]);

    case "ADD_SOURCES":
      return addSources(state, action.sources);

    case "INSERT_SOURCE_ACTORS":
      return insertSourceActors(state, action as InsertSourceActorsAction);

    case "REMOVE_SOURCE_ACTORS":
      return removeSourceActors(state, action as RemoveSourceActorsAction);

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

    case "debuggerUI/setViewport":
      return { ...state, selectedLocationHasScrolled: true };

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
      return updateLoadedState(state, action as SourceTextLoadedAction);

    case "BLACKBOX":
      if (action.status === "done") {
        const { id, url } = action.source;
        const { isBlackBoxed } = action.value;
        // TODO This should be outside of a reducer
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

    case "SET_FOCUSED_SOURCE_ITEM":
      return { ...state, focusedItem: action.item };

    case "sources/allSourcesReceived":
      return { ...state, sourcesLoading: false };
  }
  */

  return state;
}

/*

export const resourceAsSourceBase = memoizeResourceShallow(
  ({ content, ...source }: Source) => source
);

const resourceAsSourceWithContent = memoizeResourceShallow(({ content, ...source }: Source) => ({
  ...source,
  // @ts-ignore Ignore async value errors for now
  content: asSettled(content!),
}));

export type SourceWithContent = ReturnType<typeof resourceAsSourceWithContent>;
*/

/*

 * Add sources to the sources store
 * - Add the source to the sources store
 * - Add the source URL to the urls map
 */
/*
function addSources(state: SourcesState, sources: Source[]) {
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
    const existing = state.urls[source.url!] || [];
    if (!existing.includes(source.id)) {
      state.urls[source.url!] = [...existing, source.id];
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

function insertSourceActors(state: SourcesState, action: InsertSourceActorsAction) {
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

  return state;
}
*/

/*
 * Update sources when the worker list changes.
 * - filter source actor lists so that missing threads no longer appear
 * - NOTE: we do not remove sources for destroyed threads
 */
/*
function removeSourceActors(state: SourcesState, action: RemoveSourceActorsAction) {
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
*/
/*
 * Update a source's loaded text content.
 */
/*
function updateLoadedState(state: SourcesState, action: SourceTextLoadedAction) {
  const { sourceId } = action;

  // If there was a navigation between the time the action was started and
  // completed, we don't want to update the store.
  if (action.epoch !== state.epoch || !hasResource(state.sources, sourceId)) {
    return state;
  }

  let content: SourceContent | null = null;
  if (action.status === "start") {
    content = pending() as SourceContent;
  } else if (action.status === "error") {
    content = rejected(action.error) as SourceContent;
  } else if (typeof action.value.text === "string") {
    content = fulfilled({
      type: "text",
      value: action.value.text,
      contentType: action.value.contentType,
    }) as SourceContent;
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
*/

/*
 * Update a source when its state changes
 * e.g. the text was loaded, it was blackboxed
 */
/*
function updateBlackboxFlag(state: SourcesState, sourceId: string, isBlackBoxed: boolean) {
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


function updateBlackBoxList(url: string, isBlackBoxed: boolean) {
  const tabs = getBlackBoxList();
  const i = tabs.indexOf(url);
  if (i >= 0) {
    if (!isBlackBoxed) {
      tabs.splice(i, 1);
    }
  } else if (isBlackBoxed) {
    tabs.push(url);
  }
  // @ts-expect-error Check on actual prefs usage here
  prefs.tabsBlackBoxed = tabs;
}
*/
export function getBlackBoxList(): string[] {
  // @ts-expect-error Check on actual prefs usage here
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

/*
const getSourcesState = (state: UIState) => state.sources;

export function getSourceThreads(state: UIState, source: Source) {
  return uniq(
    getSourceActors(state, state.sources.actors[source.id]).map(
      (actor: SourceActor) => actor.thread
    )
  );
}

export function getSourceInSources(sources: ResourceState<Source>, id: string) {
  return hasResource(sources, id) ? getMappedResource(sources, id, resourceAsSourceBase) : null;
}

export function getSource(state: UIState, id: string) {
  return getSourceInSources(getSources(state), id);
}

export function getSourceFromId(state: UIState, id: string) {
  const source = getSource(state, id);
  if (!source) {
    throw new Error(`source ${id} does not exist`);
  }
  return source;
}

export function getSourceByActorId(state: UIState, actorId: string) {
  if (!hasSourceActor(state, actorId)) {
    return null;
  }

  return getSource(state, getSourceActor(state, actorId).source);
}

export function getSourcesByURLInSources(
  sources: ResourceState<Source>,
  urls: Record<string, string[]>,
  url: string
) {
  if (!url || !urls[url]) {
    return [];
  }
  return urls[url].map(id => getMappedResource(sources, id, resourceAsSourceBase));
}

export function getSourcesByURL(state: UIState, url: string) {
  return getSourcesByURLInSources(getSources(state), getUrls(state), url);
}

export function getSourceByURL(state: UIState, url: string) {
  const foundSources = getSourcesByURL(state, url);
  return foundSources ? foundSources[0] : null;
}

export function getSpecificSourceByURLInSources(
  sources: ResourceState<Source>,
  urls: Record<string, string[]>,
  url: string
) {
  const foundSources = getSourcesByURLInSources(sources, urls, url);
  if (foundSources) {
    return foundSources[0];
  }
  return null;
}

export function getSpecificSourceByURL(state: UIState, url: string) {
  return getSpecificSourceByURLInSources(getSources(state), getUrls(state), url);
}

export function getOriginalSourceByURL(state: UIState, url: string) {
  return getSpecificSourceByURL(state, url);
}

export function getGeneratedSourceByURL(state: UIState, url: string) {
  return getSpecificSourceByURL(state, url);
}

export function getGeneratedSource(state: UIState, source: Source) {
  if (!source) {
    return null;
  }

  return source;
}

export function getGeneratedSourceById(state: UIState, sourceId: string) {
  return getSourceFromId(state, sourceId);
}

export function getPendingSelectedLocation(state: UIState) {
  return state.sources.pendingSelectedLocation;
}

export function getPrettySource(state: UIState, id: string) {
  if (!id) {
    return;
  }

  const source = getSource(state, id);
  if (!source) {
    return;
  }

  return getOriginalSourceByURL(state, getPrettySourceURL(source.url!));
}

export function hasPrettySource(state: UIState, id: string) {
  return !!getPrettySource(state, id);
}

export function getSourcesUrlsInSources(state: UIState, url: string) {
  if (!url) {
    return [];
  }

  const plainUrl = getPlainUrl(url);
  return getPlainUrls(state)[plainUrl] || [];
}

export function getHasSiblingOfSameName(state: UIState, source: Source) {
  if (!source) {
    return false;
  }

  return getSourcesUrlsInSources(state, source.url!).length > 1;
}

const querySourceList = makeReduceAllQuery(resourceAsSourceBase, sources => sources.slice());

export function getSources(state: UIState) {
  return state.sources.sources;
}

export function getSourcesEpoch(state: UIState) {
  return state.sources.epoch;
}

export function getUrls(state: UIState) {
  return state.sources.urls;
}

export function getPlainUrls(state: UIState) {
  return state.sources.plainUrls;
}

export function getSourceList(state: UIState) {
  return querySourceList(getSources(state));
}

export function getDisplayedSourcesList(state: UIState) {
  return Object.values(getDisplayedSources(state)).flatMap(Object.values);
}

export function getExtensionNameBySourceUrl(state: UIState, url: string) {
  const match = getSourceList(state).find(source => source.url && source.url.startsWith(url));
  if (match && match.extensionName) {
    return match.extensionName;
  }
}

export function getSourceCount(state: UIState) {
  return getSourceList(state).length;
}

export const getSelectedLocation = createSelector(
  getSourcesState,
  sources => sources.selectedLocation
);

export type SelectedSource = ReturnType<typeof getSelectedSource>;

export const getSelectedSource = createSelector(
  (state: UIState) => state.sources.selectedLocation?.sourceId,
  getSources,
  (sourceId, sources) => {
    if (!sourceId) {
      return;
    }

    return getSourceInSources(sources, sourceId!);
  }
);

export const getSelectedSourceWithContent = createSelector(
  getSelectedLocation,
  getSources,
  (selectedLocation, sources) => {
    const source = selectedLocation && getSourceInSources(sources, selectedLocation.sourceId!);
    return source ? getMappedResource(sources, source.id, resourceAsSourceWithContent) : null;
  }
);
export function getSourceWithContent(state: UIState, id: string) {
  return getMappedResource(state.sources.sources, id, resourceAsSourceWithContent);
}
export function getSourceContent(state: UIState, id: string) {
  const { content } = getResource(state.sources.sources, id);
  // @ts-ignore Ignore async value errors for now
  return asSettled(content);
}

export function getSelectedSourceId(state: UIState) {
  const source = getSelectedSource(state);
  return source && source.id;
}

export const getDisplayedSources = createSelector(
  (state: UIState) => state.sources.sources,
  sources => {
    const result: Record<string, Source> = {};

    for (const id in sources.identity) {
      result[id] = getResource(sources, id);
    }

    return result;
  }
);

export function getSourceActorsForSource(state: UIState, id: string) {
  const actors = state.sources.actors[id];
  if (!actors) {
    return [];
  }

  return getSourceActors(state, actors);
}

export function canLoadSource(state: UIState, sourceId: string) {
  // Return false if we know that loadSourceText() will fail if called on this
  // source. This is used to avoid viewing such sources in the debugger.
  const source = getSource(state, sourceId);
  if (!source) {
    return false;
  }

  const actors = getSourceActorsForSource(state, sourceId);
  return actors.length != 0;
}

export function isSourceWithMap(state: UIState, id: string): boolean {
  return getSourceActorsForSource(state, id).some(sourceActor => sourceActor.sourceMapURL);
}

// Ideally probably I would actually rename this to better reflect the protocol
// resource/new reducer, but that would lead to a much more shotgun-surgery
// style refactor, which I'm trying to avoid
export function getBreakpointPositionsForSource(state: UIState, sourceId: string) {
  return getPossibleBreakpointsForSource(state, sourceId);
}

export function hasBreakpointPositions(state: UIState, sourceId: string) {
  return !!getBreakpointPositionsForSource(state, sourceId);
}

export function getBreakpointPositionsForLine(state: UIState, sourceId: string, line: number) {
  const positions = getBreakpointPositionsForSource(state, sourceId);
  return positions && positions[line];
}

export function hasBreakpointPositionsForLine(state: UIState, sourceId: string, line: number) {
  return !!getBreakpointPositionsForLine(state, sourceId, line);
}

export function isSourceLoadingOrLoaded(state: UIState, sourceId: string) {
  const { content } = getResource(state.sources.sources, sourceId);
  return content !== null;
}

export function selectedLocationHasScrolled(state: UIState) {
  return state.sources.selectedLocationHasScrolled;
}

export function getTextAtLocation(
  state: UIState,
  id: string,
  location: Location & { sourceUrl: string }
) {
  const source = getSource(state, id);
  if (!source) {
    return null;
  }

  const content = getSourceContent(state, id);
  if (!content) {
    return null;
  }

  const text = getTextAtPosition(content, { ...location, column: 0 });

  return text;
}

export function getSourcesLoading(state: UIState) {
  return state.sources.sourcesLoading;
}
*/

export default update;
