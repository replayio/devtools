/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { Location } from "@replayio/protocol";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import type { UIState } from "ui/state";

import {
  createPendingBreakpoint as savePendingBreakpoint,
  makePendingLocationId,
} from "../utils/breakpoint";

import { removeBreakpoint, removeBreakpoints, Breakpoint } from "./breakpoints";
import { PendingBreakpoint, SourceLocation } from "./types";

/**
 * A set of known breakpoints for all recordings, persisted to `indexedDB`
 */
export type PendingBreakpointsState = Record<string, PendingBreakpoint>;

const pendingBreakpointsSlice = createSlice({
  name: "pendingBreakpoints",
  initialState: {} as PendingBreakpointsState,
  reducers: {
    createPendingBreakpoint: (
      state,
      action: PayloadAction<{ breakpoint: Breakpoint; recordingId: string; sourceUrl: string }>
    ) => {
      const { breakpoint, recordingId } = action.payload;
      const pendingLocation = { ...breakpoint.location, sourceUrl: action.payload.sourceUrl };
      // Pending breakpoints are a little special, they need to have extra
      // details because they persist things across sessions.
      const locationId = makePendingLocationId(pendingLocation, recordingId);
      const pendingBreakpoint = savePendingBreakpoint(breakpoint, action.payload.sourceUrl);
      state[locationId] = pendingBreakpoint;
    },
    removePendingBreakpoint: {
      reducer(
        state,
        action: PayloadAction<{ location: Location & { sourceUrl: string }; recordingId: string }>
      ) {
        const { location, recordingId } = action.payload;
        const locationId = makePendingLocationId(location, recordingId);
        delete state[locationId];
      },
      prepare(location: Location & { sourceUrl: string }, recordingId: string, cx?: Context) {
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

export const { createPendingBreakpoint, removePendingBreakpoint } = pendingBreakpointsSlice.actions;

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
