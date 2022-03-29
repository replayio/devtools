/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Redux actions for the sources state
 * @module actions/sources
 */

import { tabExists } from "../../reducers/tabs";
import { getFrames, getSelectedFrameId } from "../../reducers/pause";
import { setSymbols } from "./symbols";
import { closeActiveSearch, updateActiveFileSearch } from "../ui";
import { addTab } from "../tabs";
import { loadSourceText } from "./loadSourceText";
import { setBreakableLines, setBreakpointHitCounts } from ".";

import { createLocation } from "../../utils/location";
import { getToolboxLayout } from "ui/reducers/layout";
import { setSelectedPanel } from "ui/actions/layout";
import { trackEvent } from "ui/utils/telemetry";
import { paused } from "../pause/paused";

import { ThreadFront } from "protocol/thread";

import { prefs } from "devtools/shared/services";

import {
  getSource,
  getSourceByURL,
  getActiveSearch,
  getSelectedSource,
  getExecutionPoint,
  getThreadContext,
  getContext,
} from "../../selectors";

export const setSelectedLocation = (cx, source, location) => ({
  type: "SET_SELECTED_LOCATION",
  cx,
  source,
  location,
});

export const setPendingSelectedLocation = (cx, url, options) => ({
  type: "SET_PENDING_SELECTED_LOCATION",
  cx,
  url,
  line: options ? options.line : null,
  column: options ? options.column : null,
});

export const clearSelectedLocation = cx => ({
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
export function selectSourceURL(cx, url, options) {
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
export function selectSource(cx, sourceId, options = {}, openSourcesTab) {
  return async dispatch => {
    trackEvent("sources.select");
    const location = createLocation({ ...options, sourceId });
    return dispatch(selectSpecificLocation(cx, location, openSourcesTab));
  };
}

export function deselectSource() {
  return (dispatch, getState) => {
    const cx = getThreadContext(getState());
    dispatch(clearSelectedLocation(cx));
  };
}

/**
 * @memberof actions/sources
 * @static
 */
export function selectLocation(cx, location, openSourcesTab = true) {
  return async (dispatch, getState, { client }) => {
    const currentSource = getSelectedSource(getState());
    trackEvent("sources.select_location");

    if (!client) {
      // No connection, do nothing. This happens when the debugger is
      // shut down too fast and it tries to display a default source.
      return;
    }

    const source = getSource(getState(), location.sourceId);
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
    dispatch({ type: "SHOW_SOURCE", source: null });
    dispatch({ type: "SHOW_SOURCE", source });

    const loadedSource = getSource(getState(), source.id);

    if (!loadedSource) {
      // If there was a navigation while we were loading the loadedSource
      return;
    }

    dispatch(setSymbols({ cx, source: loadedSource }));

    // If a new source is selected update the file search results
    const newSource = getSelectedSource(getState());
    if (currentSource && currentSource !== newSource) {
      dispatch(updateActiveFileSearch(cx));
    }
  };
}

/**
 * @memberof actions/sources
 * @static
 */
export function selectSpecificLocation(cx, location, openSourcesTab) {
  return selectLocation(cx, location, openSourcesTab);
}

// The RRP protocol values include both generated and original information about
// a paused frame and its scope contents. The ThreadFront is responsible for
// determining which one to use. When changing between a generated and original
// source, we tell the thread which one we prefer.
// Then, if we're currently paused in this source, we perform the pause again to
// refresh all the debugger's state, this will also open the alternate source.
// Otherwise, we only open the alternate source in the editor.
export function showAlternateSource(oldSourceId, newSourceId) {
  return async (dispatch, getState) => {
    if (ThreadFront.isSourceMappedSource(oldSourceId)) {
      ThreadFront.preferSource(newSourceId, true);
    } else {
      ThreadFront.preferSource(oldSourceId, false);
    }

    let isPausedInSource = false;
    const state = getState();
    const frames = getFrames(state);
    if (frames) {
      const selectedFrameId = getSelectedFrameId(state);
      const selectedFrame = frames.find(f => f.id == selectedFrameId);
      if (selectedFrame?.location.sourceId === oldSourceId) {
        isPausedInSource = true;
      }
    }

    if (isPausedInSource) {
      const executionPoint = getExecutionPoint(state);
      await dispatch(paused({ executionPoint }));
    } else {
      await dispatch(selectSource(getContext(state), newSourceId));
    }
  };
}
