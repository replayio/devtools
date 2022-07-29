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

import { setRequestedBreakpoint } from "../../reducers/breakpoints";
import type { Context } from "../../reducers/pause";
import { getPendingBreakpointsForSource, getContext } from "../../selectors";
import { getTabs, tabsRestored } from "devtools/client/debugger/src/reducers/tabs";

import {
  getSourceDetails,
  allSourcesReceived,
  SourceDetails,
  getAllSourceDetails,
  getSourceToDisplayForUrl,
  getSourceToDisplayById,
} from "ui/reducers/sources";
import { syncBreakpoint } from "../breakpoints";

import { toggleBlackBox } from "./blackbox";
import { experimentalLoadSourceText, getPreviousPersistedLocation } from "ui/reducers/sources";
import { AppStartListening } from "ui/setup/listenerMiddleware";

import { prefs } from "../../utils/prefs";

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

export function getBlackBoxList(): string[] {
  // @ts-expect-error Check on actual prefs usage here
  return prefs.tabsBlackBoxed || [];
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

// Delay adding these until the store is created
export const setupSourcesListeners = (startAppListening: AppStartListening) => {
  // When sources are received, we need to:
  // - Update any persisted tabs to give them the correct source IDs for their URLs
  // - Check for an existing selected location, and open that automatically
  // - Restore any breakpoints that the user had set last time
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
        .map(tab => getSourceToDisplayForUrl(state, tab.url)!)
        .filter(Boolean);

      // Now that we know what sources _were_ open, update the tabs data
      // so that the sources are associated with each tab
      dispatch(tabsRestored(canonicalTabSources));

      let selectedSourceToDisplay: SourceDetails | null = null;

      // There may have been a location persisted from the last time the user
      // had this recording open. If so, we want to try to restore that open
      // file and line.
      if (persistedLocation) {
        if (persistedLocation.sourceUrl) {
          selectedSourceToDisplay = getSourceToDisplayForUrl(state, persistedLocation.sourceUrl)!;
        } else if (persistedLocation.sourceId) {
          selectedSourceToDisplay = getSourceToDisplayById(state, persistedLocation.sourceId)!;
        }

        if (selectedSourceToDisplay) {
          const { selectLocation } = await import("../sources");

          await dispatch(
            selectLocation(cx, {
              column: persistedLocation.column,
              line: typeof persistedLocation.line === "number" ? persistedLocation.line : 0,
              sourceId: selectedSourceToDisplay.id,
              sourceUrl: selectedSourceToDisplay.url,
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
