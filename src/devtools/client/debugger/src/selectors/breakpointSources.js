/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import sortBy from "lodash/sortBy";
import uniq from "lodash/uniq";
import { createSelector } from "reselect";
import {
  getSources,
  getBreakpointsList,
  getSelectedSource,
  resourceAsSourceBase,
} from "../selectors";
import { getFilename } from "../utils/source";
import { makeShallowQuery } from "../utils/resource";
import { isBreakable, isLogpoint, sortSelectedBreakpoints } from "../utils/breakpoint";

function getBreakpointsForSource(source, selectedSource, breakpoints) {
  return sortSelectedBreakpoints(breakpoints, selectedSource).filter(
    bp => bp.location.sourceId == source.id
  );
}

export const findBreakpointSources = state => {
  const breakpoints = getBreakpointsList(state);
  const sources = getSources(state);
  const selectedSource = getSelectedSource(state);
  return queryBreakpointSources(sources, { breakpoints, selectedSource });
};

const queryBreakpointSources = makeShallowQuery({
  filter: (_, { breakpoints, selectedSource }) => uniq(breakpoints.map(bp => bp.location.sourceId)),
  map: resourceAsSourceBase,
  reduce: sources => {
    const filtered = sources.filter(source => source && !source.isBlackBoxed);
    return sortBy(filtered, source => getFilename(source));
  },
});

export const getBreakpointSources = createSelector(
  getBreakpointsList,
  findBreakpointSources,
  getSelectedSource,
  (breakpoints, sources, selectedSource) => {
    return sources
      .map(source => ({
        source,
        breakpoints: getBreakpointsForSource(source, selectedSource, breakpoints),
      }))
      .filter(({ breakpoints: bpSources }) => bpSources.length > 0);
  }
);

export const getBreakableBreakpointSources = createSelector(
  getBreakpointsList,
  findBreakpointSources,
  getSelectedSource,
  (breakpoints, sources, selectedSource) => {
    return sources
      .map(source => ({
        source,
        breakpoints: getBreakpointsForSource(source, selectedSource, breakpoints).filter(bp =>
          isBreakable(bp)
        ),
      }))
      .filter(({ breakpoints: bpSources }) => bpSources.length > 0);
  }
);

export const getLogpointSources = createSelector(
  getBreakpointsList,
  findBreakpointSources,
  getSelectedSource,
  (breakpoints, sources, selectedSource) => {
    return sources
      .map(source => ({
        source,
        breakpoints: getBreakpointsForSource(source, selectedSource, breakpoints).filter(bp =>
          isLogpoint(bp)
        ),
      }))
      .filter(({ breakpoints: bpSources }) => bpSources.length > 0);
  }
);
