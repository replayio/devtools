/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import type { UIState } from "ui/state";

import { createPendingBreakpoint, makePendingLocationId } from "../utils/breakpoint";

import { setBreakpoint, removeBreakpoint, removeBreakpoints } from "./breakpoints";
import { PendingBreakpoint, SourceLocation } from "./types";

export type PendingBreakpointsState = Record<string, PendingBreakpoint>;

const pendingBreakpointsSlice = createSlice({
  name: "pendingBreakpoints",
  initialState: {} as PendingBreakpointsState,
  reducers: {
    removePendingBreakpoint: {
      reducer(state, action: PayloadAction<{ location: SourceLocation; recordingId: string }>) {
        const { location, recordingId } = action.payload;
        const locationId = makePendingLocationId(location, recordingId);
        delete state[locationId];
      },
      prepare(location: SourceLocation, recordingId: string, cx?: Context) {
        // Add cx to action.meta
        return {
          payload: { location, recordingId },
          meta: { cx },
        };
      },
    },
  },
  extraReducers: builder => {
    builder
      .addCase(setBreakpoint, (state, action) => {
        const { breakpoint, recordingId } = action.payload;
        const locationId = makePendingLocationId(breakpoint.location, recordingId);
        const pendingBreakpoint = createPendingBreakpoint(breakpoint);
        state[locationId] = pendingBreakpoint;
      })
      .addCase(removeBreakpoint, (state, action) => {
        // same as removePendingBreakpoint
        const { location, recordingId } = action.payload;
        const locationId = makePendingLocationId(location, recordingId);
        delete state[locationId];
      })
      .addCase(removeBreakpoints, () => {
        return {};
      });
  },
});

export const { removePendingBreakpoint } = pendingBreakpointsSlice.actions;

export default pendingBreakpointsSlice.reducer;

// Selectors

export function getPendingBreakpoints(state: UIState) {
  return state.pendingBreakpoints;
}

export function getPendingBreakpointList(state: UIState, recordingId: string) {
  return Object.entries(getPendingBreakpoints(state))
    .filter(([key]) => key.startsWith(recordingId))
    .map(([_, value]) => value);
}

export function getPendingBreakpointsForSource(
  state: UIState,
  source: { url?: string },
  recordingId: string
) {
  return getPendingBreakpointList(state, recordingId).filter(pendingBreakpoint => {
    return pendingBreakpoint.location.sourceUrl === source.url;
  });
}
