/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { createSelector } from "reselect";
import uniqBy from "lodash/uniqBy";

import { getBreakpointsList, getRequestedBreakpointsList } from "./breakpoints";
import { getSelectedSource } from "../reducers/sources";

import { sortSelectedBreakpoints } from "../utils/breakpoint";

/*
 * Finds the breakpoints, which appear in the selected source.
 */
export const getVisibleBreakpoints = createSelector(
  getSelectedSource,
  getBreakpointsList,
  (selectedSource, breakpoints) => {
    if (!selectedSource) {
      return null;
    }

    return breakpoints.filter(bp => selectedSource && bp.location.sourceId === selectedSource.id);
  }
);

/*
 * Finds the requested breakpoints, which appear in the selected source.
 */
export const getVisibleRequestedBreakpoints = createSelector(
  getSelectedSource,
  getRequestedBreakpointsList,
  (selectedSource, breakpoints) => {
    if (!selectedSource) {
      return null;
    }

    return breakpoints.filter(bp => bp.location.sourceId === selectedSource.id);
  }
);

/*
 * Finds the first breakpoint per line, which appear in the selected source,
 * including requested breakpoints.
 */
export const getFirstVisibleBreakpoints = createSelector(
  getVisibleBreakpoints,
  getVisibleRequestedBreakpoints,
  getSelectedSource,
  (breakpoints, requestedBreakpoints, selectedSource) => {
    if (!breakpoints || !selectedSource) {
      return [];
    }

    const allBreakpoints = [...breakpoints, ...requestedBreakpoints];
    return uniqBy(sortSelectedBreakpoints(allBreakpoints, selectedSource), bp => bp.location.line);
  }
);
