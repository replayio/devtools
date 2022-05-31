/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { createSlice, createEntityAdapter, PayloadAction, EntityState } from "@reduxjs/toolkit";
import { Location, PointDescription, AnalysisEntry } from "@replayio/protocol";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import string from "devtools/packages/devtools-reps/reps/string";
import { AnalysisError } from "protocol/thread/analysis";
import type { UIState } from "ui/state";

import { getBreakpointsList } from "../selectors/breakpoints";
import assert from "../utils/assert";
import { getLocationKey, isMatchingLocation, isLogpoint } from "../utils/breakpoint";

import { getSelectedSource } from "./sources";
import type { Breakpoint, SourceLocation } from "./types";
export type { Breakpoint } from "./types";

type LocationWithoutColumn = Omit<Location, "column">;

export enum AnalysisStatus {
  // Happy path
  Created = "Created",
  LoadingPoints = "LoadingPoints",
  PointsRetrieved = "PointsRetrieved",
  LoadingResults = "LoadingResults",
  Completed = "Completed",

  // We don't have this yet, but we *should*, it's important. For instance, when
  // a user changes their focus region and we're going to rerun this anyways?
  // Cancel it!
  Cancelled = "Cancelled",

  // These errors mean very different things! The max hits for getting points is
  // 10,000, while the max hits for running an analysis is 200!
  ErroredGettingPoints = "ErroredGettingPoints",
  ErroredRunning = "ErroredRunning",
}

export type AnalysisSummary = {
  error: AnalysisError | undefined;
  id: string;
  location: Location | undefined;
  condition?: string;
  points: PointDescription[] | undefined;
  // Do we want to store results here? I guess so? They can be a bit
  // unweildy I think, but I expect they will be serializable.
  results: AnalysisEntry[] | undefined;
  status: AnalysisStatus;
};

export interface BreakpointsState {
  /**
   * Actual breakpoint entries, keyed by a location string
   */
  breakpoints: Record<string, Breakpoint>;
  /**
   * Indicates which breakpoints have been optimistically added and
   * are still being processed by the Replay backend server
   */
  requestedBreakpoints: Record<string, LocationWithoutColumn>;
  /**
   * Analysis entries associated with breakpoints, keyed by GUID.
   */
  analyses: EntityState<AnalysisSummary>;
}

const analysesAdapter = createEntityAdapter<AnalysisSummary>();

export function initialBreakpointsState(): BreakpointsState {
  return {
    breakpoints: {},
    requestedBreakpoints: {},
    analyses: analysesAdapter.getInitialState(),
  };
}

const breakpointsSlice = createSlice({
  name: "breakpoints",
  initialState: initialBreakpointsState,
  reducers: {
    setBreakpoint: {
      reducer(state, action: PayloadAction<{ breakpoint: Breakpoint; recordingId: string }>) {
        const { breakpoint } = action.payload;
        const location = breakpoint.location;
        const id = getLocationKey(location);
        state.breakpoints[id] = breakpoint;

        // Also remove any requested breakpoint that corresponds to this location
        breakpointsSlice.caseReducers.removeRequestedBreakpoint(
          state,
          breakpointsSlice.actions.removeRequestedBreakpoint(location)
        );
      },
      prepare(breakpoint: Breakpoint, recordingId: string, cx?: Context) {
        // Add cx to action.meta
        return {
          payload: { breakpoint, recordingId },
          meta: { cx },
        };
      },
    },
    removeBreakpoint: {
      reducer(state, action: PayloadAction<{ location: SourceLocation; recordingId: string }>) {
        const id = getLocationKey(action.payload.location);
        delete state.breakpoints[id];
      },
      prepare(location: SourceLocation, recordingId: string, cx?: Context) {
        // Add cx to action.meta
        return {
          payload: { location, recordingId },
          meta: { cx },
        };
      },
    },
    setRequestedBreakpoint(state, action: PayloadAction<LocationWithoutColumn>) {
      const location = action.payload;
      // @ts-ignore intentional field check
      assert(!location.column, "location should have no column");
      const requestedId = getLocationKey(location);
      state.requestedBreakpoints[requestedId] = location;
    },
    removeRequestedBreakpoint(state, action: PayloadAction<LocationWithoutColumn>) {
      const requestedId = getLocationKey({ ...action.payload, column: undefined });
      delete state.requestedBreakpoints[requestedId];
    },
    removeBreakpoints(state) {
      state.breakpoints = {};
      state.requestedBreakpoints = {};
    },

    analysisCreated(state, action: PayloadAction<string>) {
      analysesAdapter.addOne(state.analyses, {
        error: undefined,
        id: action.payload,
        location: undefined,
        condition: undefined,
        points: undefined,
        results: undefined,
        status: AnalysisStatus.Created,
      });
    },
    analysisPointsRequested(state, action: PayloadAction<string>) {
      analysesAdapter.updateOne(state.analyses, {
        id: action.payload,
        changes: { status: AnalysisStatus.LoadingPoints },
      });
    },
    analysisPointsReceived(
      state,
      action: PayloadAction<{ analysisId: string; points: PointDescription[] }>
    ) {
      analysesAdapter.updateOne(state.analyses, {
        id: action.payload.analysisId,
        changes: {
          points: action.payload.points,
          status: AnalysisStatus.PointsRetrieved,
        },
      });
    },
    analysisResultsRequested(state, action: PayloadAction<string>) {
      analysesAdapter.updateOne(state.analyses, {
        id: action.payload,
        changes: { status: AnalysisStatus.LoadingResults },
      });
    },
    analysisResultsReceived(
      state,
      action: PayloadAction<{ analysisId: string; results: AnalysisEntry[] }>
    ) {
      const { analysisId, results } = action.payload;

      // Preemptively freeze the `results` array to keep Immer from recursively freezing,
      // because we have mutable class instances nested inside (EW!)
      Object.freeze(results);

      analysesAdapter.updateOne(state.analyses, {
        id: analysisId,
        changes: { status: AnalysisStatus.Completed, results },
      });
    },
    analysisErrored(
      state,
      action: PayloadAction<{
        analysisId: string;
        error: AnalysisError;
        points?: PointDescription[];
        results?: AnalysisEntry[];
      }>
    ) {
      const { analysisId, error, points, results } = action.payload;

      const analysis = state.analyses.entities[analysisId];
      const currentStatus = analysis?.status;
      const isLoadingPoints = currentStatus === AnalysisStatus.LoadingPoints;
      const isLoadingResults = currentStatus === AnalysisStatus.LoadingResults;
      if (!isLoadingPoints && !isLoadingResults) {
        throw "Invalid state update";
      }

      if (points) {
        Object.freeze(points);
      }

      if (results) {
        Object.freeze(results);
      }

      analysesAdapter.updateOne(state.analyses, {
        id: analysisId,
        changes: {
          status: isLoadingPoints
            ? AnalysisStatus.ErroredGettingPoints
            : AnalysisStatus.ErroredRunning,
          points: isLoadingPoints ? points : analysis?.points,
          results: isLoadingResults ? results : analysis?.results,
          error,
        },
      });
    },
  },
});

export const {
  analysisCreated,
  analysisErrored,
  analysisPointsReceived,
  analysisPointsRequested,
  analysisResultsReceived,
  analysisResultsRequested,
  removeBreakpoint,
  removeBreakpoints,
  removeRequestedBreakpoint,
  setBreakpoint,
  setRequestedBreakpoint,
} = breakpointsSlice.actions;

export default breakpointsSlice.reducer;

// Selectors

export function getBreakpointsMap(state: UIState) {
  return state.breakpoints.breakpoints;
}

export function getBreakpointCount(state: UIState) {
  return getBreakpointsList(state).length;
}

export function getLogpointCount(state: UIState) {
  return getBreakpointsList(state).filter(bp => isLogpoint(bp)).length;
}

export function getBreakpoint(state: UIState, location?: Location) {
  if (!location) {
    return undefined;
  }

  const breakpoints = getBreakpointsMap(state);
  return breakpoints[getLocationKey(location)];
}

export function getBreakpointsDisabled(state: UIState) {
  const breakpoints = getBreakpointsList(state);
  return breakpoints.every(breakpoint => breakpoint.disabled);
}

export function getBreakpointsForSourceId(state: UIState, line?: number) {
  const { id: sourceId } = getSelectedSource(state)!;

  if (!sourceId) {
    return [];
  }

  return getBreakpointsForSource(state, sourceId, line);
}

export function getBreakpointsForSource(state: UIState, sourceId: string, line?: number) {
  if (!sourceId) {
    return [];
  }

  const breakpoints = getBreakpointsList(state);
  return breakpoints.filter(bp => {
    const location = bp.location;
    return location.sourceId === sourceId && (!line || line == location.line);
  });
}

export function getBreakpointForLocation(state: UIState, location?: Location) {
  if (!location) {
    return undefined;
  }

  return getBreakpointsList(state).find(bp => {
    const loc = bp.location;
    return isMatchingLocation(loc, location);
  });
}

export function hasLogpoint(state: UIState, location?: Location) {
  const breakpoint = getBreakpoint(state, location);
  return breakpoint && breakpoint.options.logValue;
}

export function getLogpointsForSource(state: UIState, sourceId: string) {
  if (!sourceId) {
    return [];
  }

  const breakpoints = getBreakpointsList(state);
  return breakpoints.filter(bp => bp.location.sourceId === sourceId).filter(bp => isLogpoint(bp));
}
