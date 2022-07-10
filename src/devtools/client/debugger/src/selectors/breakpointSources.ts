/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import sortBy from "lodash/sortBy";
import uniq from "lodash/uniq";
import { createSelector } from "reselect";
import { getAllSourceDetails, getSelectedSourceDetails, getSourcesById } from "ui/reducers/sources";
import type { UIState } from "ui/state";

import type { Breakpoint } from "../reducers/types";
import { isBreakable, isLogpoint, sortSelectedBreakpoints } from "../utils/breakpoint";
import { getFilename } from "../utils/source";

import { getBreakpointsList } from "./breakpoints";

function getBreakpointsForSource(
  source: Source,
  selectedSource: Source,
  breakpoints: Breakpoint[]
) {
  return sortSelectedBreakpoints(breakpoints).filter(bp => bp.location.sourceId == source.id);
}

export const findBreakpointSources = (state: UIState) => {
  // const breakpoints = getBreakpointsList(state);
  // const sources = getAllSourceDetails(state);
  // const selectedSource = getSelectedSourceDetails(state)!;
  return [];
};

export const getBreakpointSources = createSelector(
  getBreakpointsList,
  findBreakpointSources,
  getSelectedSourceDetails,
  (breakpoints, sources, selectedSource) => {
    return [];
    // return sources
    //   .map(source => ({
    //     source,
    //     breakpoints: getBreakpointsForSource(source).filter(bp => isBreakable(bp)),
    //   }))
    //   .filter(({ breakpoints: bpSources }) => bpSources.length > 0);
  }
);

export type BreakpointOrLogpointSources = ReturnType<typeof getLogpointSources>[0];

export const getLogpointSources = createSelector(
  getBreakpointsList,
  findBreakpointSources,
  getSelectedSourceDetails,
  (breakpoints, sources, selectedSource) => {
    return sources
      .map(source => ({
        source,
        breakpoints: getBreakpointsForSource(source, selectedSource!, breakpoints).filter(bp =>
          isLogpoint(bp)
        ),
      }))
      .filter(({ breakpoints: bpSources }) => bpSources.length > 0);
  }
);
