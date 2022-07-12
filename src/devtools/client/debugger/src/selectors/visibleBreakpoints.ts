/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { createSelector } from "reselect";
import uniqBy from "lodash/uniqBy";

import { getBreakpointsList } from "./breakpoints";

import { sortSelectedBreakpoints } from "../utils/breakpoint";
import { Breakpoint } from "../reducers/types";
import { getSelectedSource } from "ui/reducers/sources";
import { LoadingState } from "ui/reducers/possibleBreakpoints";

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

    return breakpoints.filter(
      bp => !!bp && selectedSource && bp.location.sourceId === selectedSource.id
    );
  }
);

/*
 * Finds the requested breakpoints, which appear in the selected source.
 */
export const getVisibleRequestedBreakpoints = createSelector(
  getSelectedSource,
  getBreakpointsList,
  (selectedSource, breakpoints) => {
    if (!selectedSource) {
      return null;
    }

    return breakpoints.filter(
      bp => bp && bp.status === LoadingState.LOADING && bp.location.sourceId === selectedSource.id
    );
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

    const allBreakpoints: Breakpoint[] = [...breakpoints, ...requestedBreakpoints!];

    return uniqBy(sortSelectedBreakpoints(allBreakpoints), bp => bp.location.line);
  }
);
