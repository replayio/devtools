/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIState } from "ui/state";

import { createSelector } from "reselect";
import { LoadingState } from "ui/reducers/possibleBreakpoints";
import { selectAllBreakpoints } from "ui/reducers/breakpoints";

export const getBreakpointsList = createSelector(
  (state: UIState) => state.breakpoints.breakpoints,
  breakpoints => selectAllBreakpoints(breakpoints)
);

export const getRequestedBreakpointLocations = (state: UIState) =>
  getBreakpointsList(state).filter(bp => bp.status === LoadingState.LOADING);

export const getRequestedBreakpointsList = createSelector(
  getRequestedBreakpointLocations,
  requestedBreakpoints =>
    Object.entries(requestedBreakpoints).map(([id, location]) => {
      return {
        id,
        disabled: true,
        options: {},
        location,
        astLocation: {
          name: undefined,
          offset: location,
          index: 0,
        },
        text: "",
        originalText: "",
      };
    })
);
