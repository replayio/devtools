/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import sortBy from "lodash/sortBy";
import uniq from "lodash/uniq";
import { createSelector } from "reselect";
import {
  getAllSourceDetails,
  getSelectedSource,
  getSourceDetails,
  getSourcesById,
  SourceDetails,
} from "ui/reducers/sources";
import type { UIState } from "ui/state";

import type { Breakpoint } from "../reducers/types";
import { isBreakable, isLogpoint, sortSelectedBreakpoints } from "../utils/breakpoint";
import { getFilename } from "../utils/source";

import { getBreakpointsList } from "./breakpoints";

function getBreakpointsForSource(source: SourceDetails, breakpoints: Breakpoint[]) {
  return sortSelectedBreakpoints(breakpoints).filter(bp => bp.location.sourceId == source.id);
}

export const findBreakpointSources = (state: UIState) => {
  const breakpoints = getBreakpointsList(state);
  return uniq(breakpoints.map(bp => bp.location.sourceId)).map(id => getSourceDetails(state, id)!);
};

export const getBreakpointSources = createSelector(
  getBreakpointsList,
  findBreakpointSources,
  (breakpoints, sources) => {
    return sources
      .map(source => ({
        source,
        breakpoints: getBreakpointsForSource(source, breakpoints).filter(bp => isBreakable(bp)),
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
        breakpoints: getBreakpointsForSource(source, breakpoints).filter(bp => isLogpoint(bp)),
      }))
      .filter(({ breakpoints: bpSources }) => bpSources.length > 0);
  }
);
