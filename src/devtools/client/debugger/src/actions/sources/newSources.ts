/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Redux actions for the sources state
 * @module actions/sources
 */

import type { UIThunkAction } from "ui/actions";

import { insertSourceActors } from "../../actions/source-actors";
import { makeSourceId } from "../../client/create";
import { toggleBlackBox } from "./blackbox";
import { syncBreakpoint } from "../breakpoints";
import { loadSourceText } from "./loadSourceText";
import { selectLocation, setBreakableLines } from "../sources";

import { getRawSourceURL, isInlineScript } from "../../utils/source";
import {
  getBlackBoxList,
  getSource,
  getSourceFromId,
  hasSourceActor,
  getPendingSelectedLocation,
  getPendingBreakpointsForSource,
  getContext,
  isSourceLoadingOrLoaded,
} from "../../selectors";

import type { Source } from "../../reducers/sources";

import sourceQueue from "../../utils/source-queue";
import { ContextError } from "../../utils/context";

import { ThreadFront } from "protocol/thread";
import { SourceActor } from "../../reducers/source-actors";

// TODO Replace this when the `pause` reducer is converted
interface TempThreadContext {
  navigateCounter: number;
  isPaused: boolean;
  pauseCounter: number;
}

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
function checkSelectedSource(cx: TempThreadContext, sourceId: string): UIThunkAction {
  return async (dispatch, getState) => {
    const state = getState();
    const pendingLocation = getPendingSelectedLocation(state);

    if (!pendingLocation || !pendingLocation.url) {
      return;
    }

    const source = getSource(state, sourceId);

    if (!source || !source.url) {
      return;
    }

    const pendingUrl = pendingLocation.url;
    const rawPendingUrl = getRawSourceURL(pendingUrl);

    if (rawPendingUrl === source.url) {
      await dispatch(
        selectLocation(cx, {
          sourceId: source.id,
          line: typeof pendingLocation.line === "number" ? pendingLocation.line : 0,
          column: pendingLocation.column,
        })
      );
    }
  };
}

function checkPendingBreakpoints(cx: TempThreadContext, sourceId: string): UIThunkAction {
  return async (dispatch, getState) => {
    // source may have been modified by selectLocation
    const source = getSource(getState(), sourceId);
    if (!source) {
      return;
    }

    const pendingBreakpoints = getPendingBreakpointsForSource(
      getState(),
      source,
      ThreadFront.recordingId
    );

    if (pendingBreakpoints.length === 0) {
      return;
    }

    for (const bp of pendingBreakpoints) {
      const line = bp.location.line;
      dispatch({ type: "SET_REQUESTED_BREAKPOINT", location: { sourceId, line } });
    }

    // load the source text if there is a pending breakpoint for it
    await dispatch(loadSourceText({ cx, source }));

    await dispatch(setBreakableLines(cx, source.id));

    await Promise.all(
      pendingBreakpoints.map(bp => {
        return dispatch(syncBreakpoint(cx, sourceId, bp));
      })
    );
  };
}

function restoreBlackBoxedSources(cx: TempThreadContext, sources: Source[]): UIThunkAction {
  return async dispatch => {
    const tabs = getBlackBoxList();
    if (tabs.length == 0) {
      return;
    }
    for (const source of sources) {
      if (tabs.includes(source.url!) && !source.isBlackBoxed) {
        dispatch(toggleBlackBox(cx, source));
      }
    }
  };
}

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

export function newOriginalSource(sourceInfo: SourceData): UIThunkAction<Promise<Source>> {
  return async dispatch => {
    const sources = await dispatch(newOriginalSources([sourceInfo]));
    return sources[0];
  };
}
export function newOriginalSources(sourceInfo: SourceData[]): UIThunkAction<Promise<Source[]>> {
  return async (dispatch, getState) => {
    const state = getState();
    const seen = new Set();
    const sources: Source[] = [];

    for (const { id, url } of sourceInfo) {
      if (seen.has(id) || getSource(state, id!)) {
        continue;
      }

      seen.add(id);

      sources.push({
        id: id!,
        url,
        relativeUrl: url,
        isPrettyPrinted: false,
        isBlackBoxed: false,
        introductionUrl: null,
        introductionType: undefined,
        isExtension: false,
        extensionName: null,
        isOriginal: true,
      });
    }

    const cx = getContext(state);
    dispatch(addSources(cx, sources));

    await dispatch(checkNewSources(cx, sources));

    for (const source of sources) {
      dispatch(checkPendingBreakpoints(cx, source.id));
    }

    return sources;
  };
}

export function newGeneratedSource(sourceInfo: SourceData): UIThunkAction<Promise<Source>> {
  return async dispatch => {
    const sources = await dispatch(newGeneratedSources([sourceInfo]));
    return sources[0];
  };
}
export function newGeneratedSources(sourceInfo: SourceData[]): UIThunkAction<Promise<Source[]>> {
  return async (dispatch, getState, { client }) => {
    const resultIds: string[] = [];
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

      if (!getSource(getState(), newId) && !newSourcesObj[newId]) {
        newSourcesObj[newId] = {
          id: newId,
          url,
          relativeUrl: url,
          isPrettyPrinted,
          extensionName: source.extensionName,
          introductionUrl: source.introductionUrl,
          introductionType: source.introductionType,
          isBlackBoxed: false,
          isExtension: false,
          isOriginal,
        };
      }

      // We are sometimes notified about a new source multiple times if we
      // request a new source list and also get a source event from the server.
      if (!hasSourceActor(getState(), source.actor)) {
        newSourceActors.push({
          id: source.actor,
          actor: source.actor,
          thread,
          source: newId,
          isBlackBoxed: source.isBlackBoxed,
          sourceMapURL: source.sourceMapURL,
          url: source.url,
          introductionUrl: source.introductionUrl,
          introductionType: source.introductionType,
        });
      }

      resultIds.push(newId);
    }

    const newSources = Object.values(newSourcesObj);

    const cx = getContext(getState());
    dispatch(addSources(cx, newSources));
    dispatch(insertSourceActors(newSourceActors));

    for (const newSourceActor of newSourceActors) {
      // Fetch breakable lines for new HTML scripts
      // when the HTML file has started loading
      if (
        isInlineScript(newSourceActor) &&
        isSourceLoadingOrLoaded(getState(), newSourceActor.source)
      ) {
        dispatch(setBreakableLines(cx, newSourceActor.source)).catch(error => {
          if (!(error instanceof ContextError)) {
            throw error;
          }
        });
      }
    }
    await dispatch(checkNewSources(cx, newSources));

    for (const { source } of newSourceActors) {
      dispatch(checkPendingBreakpoints(cx, source));
    }

    return resultIds.map(id => getSourceFromId(getState(), id));
  };
}

function addSources(cx: TempThreadContext, sources: Source[]): UIThunkAction {
  return (dispatch, getState) => {
    dispatch({ type: "ADD_SOURCES", cx, sources });
  };
}

function checkNewSources(cx: TempThreadContext, sources: Source[]): UIThunkAction {
  return async (dispatch, getState) => {
    for (const source of sources) {
      dispatch(checkSelectedSource(cx, source.id));
    }

    dispatch(restoreBlackBoxedSources(cx, sources));

    return sources;
  };
}

export function ensureSourceActor(thread: string, sourceActor: string): UIThunkAction {
  return async function (dispatch, getState, { client }) {
    await sourceQueue.flush();
    if (hasSourceActor(getState(), sourceActor)) {
      return Promise.resolve();
    }

    const sources = await client.fetchSources(thread);
    await dispatch(newGeneratedSources(sources));
  };
}
