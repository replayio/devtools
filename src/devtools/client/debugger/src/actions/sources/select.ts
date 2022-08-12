/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

/**
 * Redux actions for the sources state
 * @module actions/sources
 */

import { UIThunkAction } from "ui/actions";
import { setSelectedPanel, setViewMode } from "ui/actions/layout";
import { getToolboxLayout, getViewMode } from "ui/reducers/layout";
import { fetchPossibleBreakpointsForSource } from "ui/reducers/possibleBreakpoints";

import { trackEvent } from "ui/utils/telemetry";

import type { Context } from "../../reducers/pause";
import { getFrames, getSelectedFrameId } from "../../reducers/pause";
import { getTabExists } from "../../reducers/tabs";
import { closeActiveSearch } from "../../reducers/ui";
import { setShownSource } from "../../reducers/ui";
import {
  loadSourceText,
  getSelectedSource,
  getSourceDetails,
  getSourceByUrl,
  SourceDetails,
  locationSelected,
  clearSelectedLocation,
} from "ui/reducers/sources";
import { getActiveSearch, getExecutionPoint, getThreadContext, getContext } from "../../selectors";
import { createLocation } from "../../utils/location";
import { paused } from "../pause/paused";

import { fetchSymbolsForSource } from "../../reducers/ast";

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
    const source = getSourceByUrl(getState(), url);
    if (!source) {
      return;
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

/**
 * @memberof actions/sources
 * @static
 */
export function selectLocation(
  cx: Context,
  location: PartialLocation,
  openSourcesTab = true
): UIThunkAction<Promise<unknown>> {
  return async (dispatch, getState, { ThreadFront }) => {
    const currentSource = getSelectedSource(getState());
    trackEvent("sources.select_location");

    if (getViewMode(getState()) == "non-dev") {
      dispatch(setViewMode("dev"));
    }

    let source = getSourceDetails(getState(), location.sourceId);
    // The location may contain a sourceId from another session (e.g. when the user clicks
    // on a comment that has a source location), but a sourceId is not guaranteed
    // to be stable across sessions (although most of the time it is).
    // We try to work around this by comparing source URLs and, if they don't match,
    // use the preferred source for the location's URL.
    if (location.sourceUrl && location.sourceUrl !== source?.url) {
      await ThreadFront.ensureAllSources();
      const sourceId = ThreadFront.getSourceToDisplayForUrl(location.sourceUrl)!.id;
      source = getSourceDetails(getState(), sourceId);
      location = { ...location, sourceId };
    }
    if (!source) {
      // If there is no source we deselect the current selected source
      return dispatch(clearSelectedLocation());
    }

    const activeSearch = getActiveSearch(getState());
    if (activeSearch && activeSearch !== "file") {
      dispatch(closeActiveSearch());
    }

    if (!getTabExists(getState(), source.id)) {
      dispatch(addTab(source));
    }

    dispatch(locationSelected({ location, source }));
    const layout = getToolboxLayout(getState());

    // Yank the user to the editor tab in case the debugger/editor is tucked in
    // the toolbox.
    if (layout !== "ide" && openSourcesTab) {
      dispatch(setSelectedPanel("debugger"));
    }

    // This adds the source's text to the client-side parser, which is a necessary step
    // before we can ask the parser to return symbols in `fetchSymbolsForSource`.
    const textPromise = dispatch(loadSourceText(source.id));
    const possibleBreakpointsPromise = dispatch(fetchPossibleBreakpointsForSource(source.id));

    await Promise.all([textPromise, possibleBreakpointsPromise]);

    // Set shownSource to null first, then the actual source to trigger
    // a proper re-render in the SourcesTree component
    dispatch(setShownSource(null));
    dispatch(setShownSource(source));

    const loadedSource = getSourceDetails(getState(), source.id);

    if (!loadedSource) {
      // If there was a navigation while we were loading the loadedSource
      return;
    }

    dispatch(fetchSymbolsForSource(loadedSource.id));

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
