/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import sortBy from "lodash/sortBy";
import uniq from "lodash/uniq";
import { createSelector } from "reselect";
import type { UIState } from "ui/state";

import { getSourceDetailsEntities } from "ui/reducers/sources";
import type { Breakpoint } from "../reducers/types";
import { isBreakable, isLogpoint, sortSelectedBreakpoints } from "../utils/breakpoint";
import { getFilename } from "../utils/source";

import { getBreakpointsList } from "./breakpoints";

function getBreakpointsForSource(sourceId: string, breakpoints: Breakpoint[]) {
  return sortSelectedBreakpoints(breakpoints).filter(bp => bp.location.sourceId == sourceId);
}

export const findBreakpointSources = createSelector(
  getBreakpointsList,
  getSourceDetailsEntities,
  (breakpoints, detailsEntities) => {
    const uniqueSourceIds = uniq(breakpoints.map(bp => bp.location.sourceId));
    const breakpointSources = uniqueSourceIds
      .map(sourceId => detailsEntities[sourceId]!)
      .filter(Boolean);
    return sortBy(breakpointSources, source => getFilename(source));
  }
);

export const getBreakpointSources = createSelector(
  getBreakpointsList,
  findBreakpointSources,
  (breakpoints, sources) => {
    return sources
      .map(source => ({
        source,
        breakpoints: getBreakpointsForSource(source.id, breakpoints).filter(bp => isBreakable(bp)),
      }))
      .filter(({ breakpoints: bpSources }) => bpSources.length > 0);
  }
);

export type BreakpointOrLogpointSources = ReturnType<typeof getLogpointSources>[0];

export const getLogpointSources = createSelector(
  getBreakpointsList,
  findBreakpointSources,
  (breakpoints, sources) => {
    return sources
      .map(source => ({
        source,
        breakpoints: getBreakpointsForSource(source.id, breakpoints).filter(bp => isLogpoint(bp)),
      }))
      .filter(({ breakpoints: bpSources }) => bpSources.length > 0);
  }
);
