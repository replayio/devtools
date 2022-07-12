/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Redux actions for the sources state
 * @module actions/sources
 */

import { UIThunkAction } from "ui/actions";
import { setSelectedPanel } from "ui/actions/layout";
import { getToolboxLayout } from "ui/reducers/layout";
import { trackEvent } from "ui/utils/telemetry";

import type { Context } from "../../reducers/pause";
import { getFrames, getSelectedFrameId } from "../../reducers/pause";
import type { Location, Source } from "../../reducers/sources";
import { tabExists } from "../../reducers/tabs";
import { closeActiveSearch } from "../../reducers/ui";
import { setShownSource } from "../../reducers/ui";
import {
  getSource,
  getSourceByURL,
  getActiveSearch,
  getSelectedSource,
  getExecutionPoint,
  getThreadContext,
  getContext,
} from "../../selectors";
import { createLocation } from "../../utils/location";
import { paused } from "../pause/paused";

import { setBreakableLines } from "./breakableLines";
import { loadSourceText } from "./loadSourceText";
import { setSymbols } from "./symbols";

type PartialLocation = Parameters<typeof createLocation>[0];

export const setSelectedLocation = (cx: Context, source: Source, location: Location) => ({
  type: "SET_SELECTED_LOCATION",
  cx,
  source,
  location,
});

interface PendingSelectedLocationOptions {
  line: number;
  column: number;
}

export const setPendingSelectedLocation = (
  cx: Context,
  url: string,
  options?: PendingSelectedLocationOptions
) => ({
  type: "SET_PENDING_SELECTED_LOCATION",
  cx,
  url,
  line: options ? options.line : null,
  column: options ? options.column : null,
});

export const clearSelectedLocation = (cx: Context) => ({
  type: "CLEAR_SELECTED_LOCATION",
  cx,
});

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
): UIThunkAction<Promise<{ type: string; cx: Context } | undefined>> {
  return async (dispatch, getState) => {
    const source = getSourceByURL(getState(), url);
    if (!source) {
      return dispatch(setPendingSelectedLocation(cx, url, options));
    }

    const sourceId = source.id;
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
  openSourcesTab?: boolean
): UIThunkAction {
  return async dispatch => {
    // @ts-ignore Unknown Mixpanel event?
    trackEvent("sources.select");
    const location = createLocation({ ...options, sourceId });
    return dispatch(selectSpecificLocation(cx, location, openSourcesTab));
  };
}

export function deselectSource(): UIThunkAction {
  return (dispatch, getState) => {
    const cx = getThreadContext(getState());
    dispatch(clearSelectedLocation(cx));
  };
}

export function addTab(source: Source) {
  const { url, id: sourceId } = source;
  const isOriginal = source.isOriginal;

  return {
    type: "ADD_TAB",
    url,
    isOriginal,
    sourceId,
  };
}

/**
 * @memberof actions/sources
 * @static
 */
export function selectLocation(
  cx: Context,
  location: PartialLocation,
  openSourcesTab = true
): UIThunkAction<Promise<{ type: string; cx: Context } | undefined>> {
  return async (dispatch, getState, { client, ThreadFront }) => {
    const currentSource = getSelectedSource(getState());
    trackEvent("sources.select_location");

    if (!client) {
      // No connection, do nothing. This happens when the debugger is
      // shut down too fast and it tries to display a default source.
      return;
    }

    let source = getSource(getState(), location.sourceId);
    // The location may contain a sourceId from another session (e.g. when the user clicks
    // on a comment that has a source location), but a sourceId is not guaranteed
    // to be stable across sessions (although most of the time it is).
    // We try to work around this by comparing source URLs and, if they don't match,
    // use the preferred source for the location's URL.
    if (location.sourceUrl && location.sourceUrl !== source?.url) {
      let sourceId = ThreadFront.getChosenSourceIdsForUrl(location.sourceUrl)[0].sourceId;
      sourceId = ThreadFront.getCorrespondingSourceIds(sourceId)[0];
      source = getSource(getState(), sourceId);
      location = { ...location, sourceId };
    }
    if (!source) {
      // If there is no source we deselect the current selected source
      return dispatch(clearSelectedLocation(cx));
    }

    const activeSearch = getActiveSearch(getState());
    if (activeSearch && activeSearch !== "file") {
      dispatch(closeActiveSearch());
    }

    if (!tabExists(getState(), source.id)) {
      dispatch(addTab(source));
    }

    // @ts-ignore Partial Location mismatch
    dispatch(setSelectedLocation(cx, source, location));
    const layout = getToolboxLayout(getState());

    // Yank the user to the editor tab in case the debugger/editor is tucked in
    // the toolbox.
    if (layout !== "ide" && openSourcesTab) {
      dispatch(setSelectedPanel("debugger"));
    }

    await dispatch(loadSourceText({ source }));
    await dispatch(setBreakableLines(cx, source.id));
    // Set shownSource to null first, then the actual source to trigger
    // a proper re-render in the SourcesTree component
    dispatch(setShownSource(null));
    dispatch(setShownSource(source));

    const loadedSource = getSource(getState(), source.id);

    if (!loadedSource) {
      // If there was a navigation while we were loading the loadedSource
      return;
    }

    dispatch(setSymbols({ cx, source: loadedSource }));

    // If a new source is selected update the file search results
    const newSource = getSelectedSource(getState());
    if (currentSource && currentSource !== newSource) {
      const { updateActiveFileSearch } = await import("../ui");
      dispatch(updateActiveFileSearch(cx));
    }
  };
}

/**
 * @memberof actions/sources
 * @static
 */
export function selectSpecificLocation(
  cx: Context,
  location: PartialLocation,
  openSourcesTab?: boolean
) {
  return selectLocation(cx, location, openSourcesTab);
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
  return async (dispatch, getState, { ThreadFront }) => {
    if (ThreadFront.isSourceMappedSource(oldSourceId)) {
      ThreadFront.preferSource(newSourceId, true);
    } else {
      ThreadFront.preferSource(oldSourceId, false);
    }

    let selectSourceByPausing = false;
    const state = getState();
    const frames = getFrames(state);
    if (frames) {
      const selectedFrameId = getSelectedFrameId(state);
      const selectedFrame = frames.find(f => f.id == selectedFrameId);
      if (
        selectedFrame?.location.sourceId === oldSourceId &&
        selectedFrame?.alternateLocation?.sourceId === newSourceId
      ) {
        selectSourceByPausing = true;
      }
    }

    if (selectSourceByPausing) {
      const executionPoint = getExecutionPoint(state);
      await dispatch(paused({ executionPoint: executionPoint! }));
    } else {
      await dispatch(selectSource(getContext(state), newSourceId));
    }
  };
}
