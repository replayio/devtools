/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

/**
 * Redux actions for the sources state
 * @module actions/sources
 */

import { sourcesCache } from "replay-next/src/suspense/SourcesCache";
import { UIThunkAction } from "ui/actions";
import { setSelectedPanel, setViewMode } from "ui/actions/layout";
import { getToolboxLayout, getViewMode } from "ui/reducers/layout";
import {
  SourceDetails,
  clearSelectedLocation,
  getSourceDetails,
  getSourceIdToDisplayForUrl,
  getSourceToDisplayForUrl,
  locationSelected,
  preferSource,
} from "ui/reducers/sources";
import { UIState } from "ui/state";
import { trackEvent } from "ui/utils/telemetry";

import { Context } from "../../reducers/pause";
import { getTabExists } from "../../reducers/tabs";
import { closeActiveSearch } from "../../reducers/ui";
import { setShownSource } from "../../reducers/ui";
import { getActiveSearch, getContext, getThreadContext } from "../../selectors";
import { createLocation } from "../../utils/location";

export type PartialLocation = Parameters<typeof createLocation>[0];

interface PendingSelectedLocationOptions {
  line: number;
  column: number;
}

/**
 * Deterministically select a source that has a given URL. This will
 * work regardless of the connection status or if the source exists
 * yet.
 *
 * This exists mostly for external things to interact with the
 * debugger.
 *
 * @memberof actions/sources
 * @static
 */
export function selectSourceURL(
  cx: Context,
  url: string,
  options: PendingSelectedLocationOptions
): UIThunkAction<Promise<unknown>> {
  return async (dispatch, getState) => {
    const sourceId = getSourceIdToDisplayForUrl(getState(), url);
    if (!sourceId) {
      return;
    }

    const location = createLocation({ ...options, sourceId });
    return dispatch(selectLocation(cx, location));
  };
}

/**
 * @memberof actions/sources
 * @static
 */
export function selectSource(
  cx: Context,
  sourceId: string,
  options: PartialLocation = {} as PartialLocation,
  openSource = true
): UIThunkAction {
  return async dispatch => {
    // @ts-ignore Unknown Mixpanel event?
    trackEvent("sources.select");
    const location = createLocation({ ...options, sourceId });
    return dispatch(selectLocation(cx, location, openSource));
  };
}

export function deselectSource(): UIThunkAction {
  return (dispatch, getState) => {
    const cx = getThreadContext(getState());
    dispatch(clearSelectedLocation());
  };
}

export function addTab(source: SourceDetails) {
  const { url, id: sourceId } = source;
  const isOriginal = source.isSourceMapped;

  return {
    type: "ADD_TAB",
    url,
    isOriginal,
    sourceId,
  };
}

// Locations may contain unstable sourceId's, whether because of a backend
// change or because we are persisting locations across replays.  We try to work
// around this by comparing source URLs and, if they don't match, use the
// preferred source for the location's URL.
export function handleUnstableSourceIds(sourceUrl: string, state: UIState): string | undefined {
  const sourceByUrl = getSourceToDisplayForUrl(state, sourceUrl);
  if (sourceByUrl) {
    return sourceByUrl.id;
  }
}

/**
 * @memberof actions/sources
 * @static
 */
export function selectLocation(
  cx: Context,
  location: PartialLocation,
  openSource = true
): UIThunkAction<Promise<unknown>> {
  return async (dispatch, getState, { replayClient }) => {
    trackEvent("sources.select_location");

    if (openSource) {
      // This action should only change view modes if it's also going to open the Sources tab.
      // Otherwise it's not possible to change locations without also opening the DevTools tab.
      if (getViewMode(getState()) == "non-dev") {
        dispatch(setViewMode("dev"));
      }
    }

    let source = getSourceDetails(getState(), location.sourceId);
    if (location.sourceUrl) {
      if (!source || location.sourceUrl !== source.url) {
        await sourcesCache.readAsync(replayClient);
        const sourceId = handleUnstableSourceIds(location.sourceUrl!, getState());
        if (sourceId) {
          source = getSourceDetails(getState(), sourceId);
        }
      }
    }

    if (!source) {
      // If there is no source we deselect the current selected source
      return dispatch(clearSelectedLocation());
    }

    const activeSearch = getActiveSearch(getState());
    if (activeSearch && activeSearch !== "file") {
      dispatch(closeActiveSearch());
    }

    if (!openSource) {
      return;
    }

    dispatch(locationSelected({ location, source }));

    if (!getTabExists(getState(), source.id)) {
      dispatch(addTab(source));
    }

    const layout = getToolboxLayout(getState());

    // Yank the user to the editor tab in case the debugger/editor is tucked in
    // the toolbox.
    if (layout !== "ide") {
      dispatch(setSelectedPanel("debugger"));
    }

    // Set shownSource to null first, then the actual source to trigger
    // a proper re-render in the SourcesTree component
    dispatch(setShownSource(null));
    dispatch(setShownSource(source));

    const loadedSource = getSourceDetails(getState(), source.id);

    if (!loadedSource) {
      // If there was a navigation while we were loading the loadedSource
      return;
    }
  };
}

// The RRP protocol values include both generated and original information about
// a paused frame and its scope contents. The ThreadFront is responsible for
// determining which one to use. When changing between a generated and original
// source, we tell the thread which one we prefer.
// Then, if we're currently paused in this source, we perform the pause again to
// refresh all the debugger's state, this will also open the alternate source.
// Otherwise, we only open the alternate source in the editor.
export function showAlternateSource(
  oldSourceId: string,
  newSourceId: string
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState();
    if (getSourceDetails(state, oldSourceId)?.isSourceMapped) {
      dispatch(preferSource({ sourceId: newSourceId, preferred: true }));
    } else {
      dispatch(preferSource({ sourceId: oldSourceId, preferred: false }));
    }
    await dispatch(selectSource(getContext(state), newSourceId));
  };
}
