/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIState } from "ui/state";

import { createSelector } from "reselect";

export const getBreakpointsList = createSelector(
  (state: UIState) => state.breakpoints.breakpoints,
  breakpoints => Object.values(breakpoints)
);

export const getRequestedBreakpointLocations = (state: UIState) =>
  state.breakpoints.requestedBreakpoints;

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
