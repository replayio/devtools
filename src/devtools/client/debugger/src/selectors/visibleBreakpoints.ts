/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { createSelector } from "reselect";
import uniqBy from "lodash/uniqBy";

import { getBreakpointsList, getRequestedBreakpointsList } from "./breakpoints";

import { sortSelectedBreakpoints } from "../utils/breakpoint";
import { Breakpoint } from "../reducers/types";
import { UIState } from "ui/state";
import { getSelectedLocation } from "ui/reducers/sources";

/*
 * Finds the breakpoints, which appear in the selected source.
 */
export const getVisibleBreakpoints = createSelector(
  (state: UIState) => state.experimentalSources.selectedLocation?.sourceId,
  getBreakpointsList,
  (selectedSourceId, breakpoints) => {
    if (!selectedSourceId) {
      return null;
    }

    return breakpoints.filter(bp => bp.location.sourceId === selectedSourceId);
  }
);

/*
 * Finds the requested breakpoints, which appear in the selected source.
 */
export const getVisibleRequestedBreakpoints = createSelector(
  (state: UIState) => getSelectedLocation(state)?.sourceId,
  getRequestedBreakpointsList,
  (selectedSourceId, breakpoints) => {
    if (!selectedSourceId) {
      return null;
    }

    return breakpoints.filter(bp => bp.location.sourceId === selectedSourceId);
  }
);

/*
 * Finds the first breakpoint per line, which appear in the selected source,
 * including requested breakpoints.
 */
export const getFirstVisibleBreakpoints = createSelector(
  getVisibleBreakpoints,
  getVisibleRequestedBreakpoints,
  (state: UIState) => getSelectedLocation(state)?.sourceId,
  (breakpoints, requestedBreakpoints, selectedSource) => {
    if (!breakpoints || !selectedSource) {
      return [];
    }

    // @ts-ignore Breakpoint location field mismatch
    const allBreakpoints: Breakpoint[] = [...breakpoints, ...requestedBreakpoints!];
    return uniqBy(sortSelectedBreakpoints(allBreakpoints), bp => bp.location.line);
  }
);
