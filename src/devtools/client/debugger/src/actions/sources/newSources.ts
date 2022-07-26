/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Redux actions for the sources state
 * @module actions/sources
 */

import type { UIThunkAction } from "ui/actions";
import { fetchPossibleBreakpointsForSource } from "ui/reducers/possibleBreakpoints";

import { insertSourceActors } from "../../actions/source-actors";
import { makeSourceId } from "../../client/create";
import { setRequestedBreakpoint } from "../../reducers/breakpoints";
import type { Context } from "../../reducers/pause";
import { SourceActor } from "../../reducers/source-actors";
import {
  getBlackBoxList,
  hasSourceActor,
  getPendingBreakpointsForSource,
  getContext,
} from "../../selectors";
import { getTabs, tabsRestored } from "devtools/client/debugger/src/reducers/tabs";
import { getPendingBreakpointList } from "devtools/client/debugger/src/reducers/pending-breakpoints";

import {
  getSourceDetails,
  allSourcesReceived,
  SourceDetails,
  getAllSourceDetails,
  getSourceDetailsEntities,
  getSourceByUrl,
  getCanonicalSource,
  getCanonicalSourceForUrl,
} from "ui/reducers/sources";
import { getRawSourceURL } from "../../utils/source";
import { syncBreakpoint } from "../breakpoints";

import { toggleBlackBox } from "./blackbox";
import { experimentalLoadSourceText, getPreviousPersistedLocation } from "ui/reducers/sources";
import { AppStartListening } from "ui/setup/listenerMiddleware";

interface SourceData {
  source: {
    actor: string;
    sourceMapURL?: string;
    url: string;
    extensionName?: string;
    introductionUrl?: string;
    introductionType?: string;
    isBlackBoxed?: boolean;
  };
  thread: string;
  id?: string;
  url?: string;
  isServiceWorker?: boolean;
}

interface SourceInfo {
  type: "generated" | "original";
  data: SourceData;
}

// If a request has been made to show this source, go ahead and
// select it.
function checkSelectedSource(cx: Context, source: SourceDetails): UIThunkAction {
  return async (dispatch, getState) => {
    const state = getState();
    const persistedLocation = getPreviousPersistedLocation(state);

    const pendingUrl = persistedLocation?.sourceUrl;
    if (!pendingUrl) {
      return;
    }

    if (!source || !source.url) {
      return;
    }

    if (pendingUrl === source.url) {
      const { selectLocation } = await import("../sources");
      await dispatch(
        selectLocation(cx, {
          column: persistedLocation.column,
          line: typeof persistedLocation.line === "number" ? persistedLocation.line : 0,
          sourceId: source.id,
        })
      );
    }
  };
}

function checkPendingBreakpoints(cx: Context, sourceId: string): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    // source may have been modified by selectLocation
    const source = getSourceDetails(getState(), sourceId);
    if (!source) {
      return;
    }

    const pendingBreakpoints = getPendingBreakpointsForSource(
      getState(),
      source,
      ThreadFront.recordingId!
    );

    if (pendingBreakpoints.length === 0) {
      return;
    }

    for (const bp of pendingBreakpoints) {
      const line = bp.location.line;
      const column = bp.location.column;
      dispatch(setRequestedBreakpoint({ column, line, sourceId }));
    }

    // load the source text if there is a pending breakpoint for it
    const textPromise = dispatch(experimentalLoadSourceText(source.id));
    const possibleBreakpointsPromise = dispatch(fetchPossibleBreakpointsForSource(source.id));

    await Promise.all([textPromise, possibleBreakpointsPromise]);

    await Promise.all(
      pendingBreakpoints.map(bp => {
        return dispatch(syncBreakpoint(cx, sourceId, bp));
      })
    );
  };
}

function restoreBlackBoxedSources(cx: Context, sources: SourceDetails[]): UIThunkAction {
  return async dispatch => {
    const tabs = getBlackBoxList();
    if (tabs.length == 0) {
      return;
    }
    // TODO Re-enable blackboxing
    /*
    for (const source of sources) {
      if (tabs.includes(source.url!) && !source.isBlackBoxed) {
        dispatch(toggleBlackBox(cx, source));
      }
    }
    */
  };
}

// TODO Delete this!
export function newQueuedSources(sourceInfo: SourceInfo[]): UIThunkAction<Promise<void>> {
  return async dispatch => {
    const generated: SourceData[] = [];
    const original: SourceData[] = [];
    for (const source of sourceInfo) {
      if (source.type === "generated") {
        generated.push(source.data);
      } else {
        original.push(source.data);
      }
    }

    if (generated.length > 0) {
      await dispatch(newGeneratedSources(generated));
    }
    if (original.length > 0) {
      await dispatch(newOriginalSources(original));
    }
  };
}

// TODO Delete this!
export function newOriginalSource(sourceInfo: SourceData): UIThunkAction<Promise<SourceDetails>> {
  return async dispatch => {
    const sources = await dispatch(newOriginalSources([sourceInfo]));
    return sources[0];
  };
}

// TODO Delete this!
export function newOriginalSources(
  sourceInfo: SourceData[]
): UIThunkAction<Promise<SourceDetails[]>> {
  return async (dispatch, getState) => {
    const state = getState();
    const seen = new Set();
    const sources: SourceDetails[] = [];

    // TODO Rewrite "check pending" handling
    /*
    for (const { id, url } of sourceInfo) {
      if (seen.has(id) || getSourceDetails(state, id!)) {
        continue;
      }

      seen.add(id);

      sources.push({
        extensionName: null,
        id: id!,
        introductionType: undefined,
        introductionUrl: null,
        isBlackBoxed: false,
        isExtension: false,
        isOriginal: true,
        isPrettyPrinted: false,
        relativeUrl: url,
        url,
      });
    }

    const cx = getContext(state);
    dispatch(addSources(cx, sources));

    await dispatch(checkNewSources(cx, sources));

    for (const source of sources) {
      dispatch(checkPendingBreakpoints(cx, source.id));
    }
*/
    return sources;
  };
}

export function newGeneratedSource(sourceInfo: SourceData): UIThunkAction<Promise<SourceDetails>> {
  return async dispatch => {
    const sources = await dispatch(newGeneratedSources([sourceInfo]));
    return sources[0];
  };
}
export function newGeneratedSources(
  sourceInfo: SourceData[]
): UIThunkAction<Promise<SourceDetails[]>> {
  return async (dispatch, getState, { ThreadFront }) => {
    const resultIds: string[] = [];

    // TODO Rewrite "check pending" handling
    /*
    const newSourcesObj: Record<string, Source> = {};
    const newSourceActors: SourceActor[] = [];

    for (const { thread, isServiceWorker, source, id } of sourceInfo) {
      const newId: string = id || makeSourceId(source, isServiceWorker);

      const kind = ThreadFront.getSourceKind(source.actor);
      const isPrettyPrinted = kind == "prettyPrinted";
      const isOriginal = kind == "sourceMapped";

      let url: string | undefined = source.url;
      if (kind == "inlineScript") {
        // Ignore inline scripts. We should see an HTML page script that includes
        // these plus the rest of the HTML.
        url = undefined;
      }

      if (ThreadFront.isMinifiedSource(source.actor)) {
        // Ignore minified sources which have a pretty printed version.
        url = undefined;
      }

      if (!getSourceDetails(getState(), newId) && !newSourcesObj[newId]) {
        newSourcesObj[newId] = {
          extensionName: source.extensionName,
          id: newId,
          introductionType: source.introductionType,
          introductionUrl: source.introductionUrl,
          isBlackBoxed: false,
          isExtension: false,
          isOriginal,
          isPrettyPrinted,
          relativeUrl: url,
          url,
        };
      }

      // We are sometimes notified about a new source multiple times if we
      // request a new source list and also get a source event from the server.
      if (!hasSourceActor(getState(), source.actor)) {
        newSourceActors.push({
          actor: source.actor,
          id: source.actor,
          introductionType: source.introductionType,
          introductionUrl: source.introductionUrl,
          isBlackBoxed: source.isBlackBoxed,
          source: newId,
          sourceMapURL: source.sourceMapURL,
          thread,
          url: source.url,
        });
      }

      resultIds.push(newId);
    }

    const newSources = Object.values(newSourcesObj);

    const cx = getContext(getState());
    dispatch(addSources(cx, newSources));
    dispatch(insertSourceActors(newSourceActors));

    await dispatch(checkNewSources(cx, newSources));

    for (const { source } of newSourceActors) {
      dispatch(checkPendingBreakpoints(cx, source));
    }
    */
    return resultIds.map(id => getSourceDetails(getState(), id)!);
  };
}

/*
function addSources(cx: Context, sources: Source[]): UIThunkAction {
  return dispatch => {
    dispatch({ cx, sources, type: "ADD_SOURCES" });
  };
}
*/

function checkNewSources(cx: Context, sources: SourceDetails[]): UIThunkAction {
  return async (dispatch, getState) => {
    for (const source of sources) {
      dispatch(checkSelectedSource(cx, source));
    }

    dispatch(restoreBlackBoxedSources(cx, sources));
    return sources;
  };
}

// Delay adding these until the store is created
export const setupSourcesListeners = (startAppListening: AppStartListening) => {
  // When sources are received, we want to check for an existing
  // selected location, and open that automatically.
  // Also, we
  startAppListening({
    actionCreator: allSourcesReceived,
    effect: async (action, listenerApi) => {
      const { dispatch, getState } = listenerApi;
      const state = getState();

      const tabs = getTabs(state);
      const persistedLocation = getPreviousPersistedLocation(state);

      const sources = getAllSourceDetails(state);
      const cx = getContext(state);

      // Tabs are persisted with just a URL, but no `sourceId` because
      // those may change across sessions. Figure out the sources per URL.
      const canonicalTabSources = tabs
        .map(tab => getCanonicalSourceForUrl(state, tab.url)!)
        .filter(Boolean);

      // Now that we know what sources _were_ open, update the tabs data
      // so that the sources are associated with each tab
      dispatch(tabsRestored(canonicalTabSources));

      let canonicalSelectedSource: SourceDetails | null = null;

      // There may have been a location persisted from the last time the user
      // had this recording open. If so, we want to try to restore that open
      // file and line.
      if (persistedLocation) {
        if (persistedLocation.sourceUrl) {
          canonicalSelectedSource = getCanonicalSourceForUrl(state, persistedLocation.sourceUrl)!;
        } else if (persistedLocation.sourceId) {
          const startingSource = getSourceDetails(state, persistedLocation.sourceId)!;
          canonicalSelectedSource = getCanonicalSource(state, startingSource);
        }

        if (canonicalSelectedSource) {
          const { selectLocation } = await import("../sources");

          await dispatch(
            selectLocation(cx, {
              column: persistedLocation.column,
              line: typeof persistedLocation.line === "number" ? persistedLocation.line : 0,
              sourceId: canonicalSelectedSource.id,
              sourceUrl: canonicalSelectedSource.url,
            })
          );
        }
      }

      // TODO Re-enable blackboxing - this is a no-op for now
      dispatch(restoreBlackBoxedSources(cx, sources));

      // There may have been some breakpoints / print statements persisted as well.
      // Reload those if possible.
      for (const source of canonicalTabSources) {
        dispatch(checkPendingBreakpoints(cx, source.id));
      }
    },
  });
};
