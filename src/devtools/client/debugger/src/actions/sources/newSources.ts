/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Redux actions for the sources state
 * @module actions/sources
 */

import { ThreadFront } from "protocol/thread";
import type { UIThunkAction } from "ui/actions";

import { insertSourceActors } from "../../actions/source-actors";
import { makeSourceId } from "../../client/create";
import type { Context } from "../../reducers/pause";
import { SourceActor } from "../../reducers/source-actors";
import type { Source } from "../../reducers/sources";
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
import { ContextError } from "../../utils/context";
import { getRawSourceURL, isInlineScript } from "../../utils/source";
import { syncBreakpoint } from "../breakpoints";
import { selectLocation, setBreakableLines } from "../sources";

import { toggleBlackBox } from "./blackbox";
import { loadSourceText } from "./loadSourceText";

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
function checkSelectedSource(cx: Context, sourceId: string): UIThunkAction {
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
          column: pendingLocation.column,
          line: typeof pendingLocation.line === "number" ? pendingLocation.line : 0,
          sourceId: source.id,
        })
      );
    }
  };
}

function checkPendingBreakpoints(cx: Context, sourceId: string): UIThunkAction {
  return async (dispatch, getState) => {
    // source may have been modified by selectLocation
    const source = getSource(getState(), sourceId);
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
      dispatch({ location: { line, sourceId }, type: "SET_REQUESTED_BREAKPOINT" });
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

function restoreBlackBoxedSources(cx: Context, sources: Source[]): UIThunkAction {
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

function addSources(cx: Context, sources: Source[]): UIThunkAction {
  return dispatch => {
    dispatch({ cx, sources, type: "ADD_SOURCES" });
  };
}

function checkNewSources(cx: Context, sources: Source[]): UIThunkAction {
  return async (dispatch, getState) => {
    for (const source of sources) {
      dispatch(checkSelectedSource(cx, source.id));
    }

    dispatch(restoreBlackBoxedSources(cx, sources));

    return sources;
  };
}
