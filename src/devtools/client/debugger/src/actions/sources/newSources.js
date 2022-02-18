/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Redux actions for the sources state
 * @module actions/sources
 */

import { stringToSourceActorId } from "../../reducers/source-actors";
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

import sourceQueue from "../../utils/source-queue";
import { ContextError } from "../../utils/context";

import { ThreadFront } from "protocol/thread";

// If a request has been made to show this source, go ahead and
// select it.
function checkSelectedSource(cx, sourceId) {
  return async ({ dispatch, getState }) => {
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

function checkPendingBreakpoints(cx, sourceId) {
  return async ({ dispatch, getState }) => {
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

function restoreBlackBoxedSources(cx, sources) {
  return async ({ dispatch }) => {
    const tabs = getBlackBoxList();
    if (tabs.length == 0) {
      return;
    }
    for (const source of sources) {
      if (tabs.includes(source.url) && !source.isBlackBoxed) {
        dispatch(toggleBlackBox(cx, source));
      }
    }
  };
}

export function newSources(sources) {
  return async ({ dispatch, getState, client }) => {
    const resultIds = [];
    const newSourcesObj = {};
    const newSourceActors = [];

    for (const { thread, isServiceWorker, source, id } of sources) {
      const newId = id || makeSourceId(source, isServiceWorker);

      const kind = ThreadFront.getSourceKind(source.actor);
      const isPrettyPrinted = kind == "prettyPrinted";
      const isOriginal = kind == "sourceMapped";

      let url = source.url;
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

      const actorId = stringToSourceActorId(source.actor);

      // We are sometimes notified about a new source multiple times if we
      // request a new source list and also get a source event from the server.
      if (!hasSourceActor(getState(), actorId)) {
        newSourceActors.push({
          id: actorId,
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

function addSources(cx, sources) {
  return ({ dispatch, getState }) => {
    dispatch({ type: "ADD_SOURCES", cx, sources });
  };
}

function checkNewSources(cx, sources) {
  return async ({ dispatch, getState }) => {
    for (const source of sources) {
      dispatch(checkSelectedSource(cx, source.id));
    }

    dispatch(restoreBlackBoxedSources(cx, sources));

    return sources;
  };
}

export function ensureSourceActor(thread, sourceActor) {
  return async function ({ dispatch, getState, client }) {
    await sourceQueue.flush();
    if (hasSourceActor(getState(), sourceActor)) {
      return Promise.resolve();
    }

    const sources = await client.fetchSources(thread);
    await dispatch(newGeneratedSources(sources));
  };
}
