/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import {
  createSlice,
  createEntityAdapter,
  createSelector,
  PayloadAction,
  EntityState,
} from "@reduxjs/toolkit";
import { Location, PointDescription, AnalysisEntry } from "@replayio/protocol";
import uniqBy from "lodash/uniqBy";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import string from "devtools/packages/devtools-reps/reps/string";
import { AnalysisError } from "protocol/thread/analysis";
import { compareNumericStrings } from "protocol/utils";
import type { UIState } from "ui/state";
import { filterToFocusRegion } from "ui/utils/timeline";

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
  location: Location;
  condition?: string;
  points: PointDescription[] | undefined;
  results: AnalysisEntry[] | undefined;
  status: AnalysisStatus;
};

export type BreakpointAnalysisMapping = {
  locationId: string;
  currentAnalysis: string | null;
  lastSuccessfulAnalysis: string | null;
  allAnalyses: string[];
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
  /**
   * Maps between a location string and analysis IDs for that location
   */
  analysisMappings: EntityState<BreakpointAnalysisMapping>;
}

const analysesAdapter = createEntityAdapter<AnalysisSummary>();
const mappingsAdapter = createEntityAdapter<BreakpointAnalysisMapping>({
  selectId: entry => entry.locationId,
});

export function initialBreakpointsState(): BreakpointsState {
  return {
    breakpoints: {},
    requestedBreakpoints: {},
    analyses: analysesAdapter.getInitialState(),
    analysisMappings: mappingsAdapter.getInitialState(),
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

        mappingsAdapter.addOne(state.analysisMappings, {
          locationId: id,
          currentAnalysis: null,
          lastSuccessfulAnalysis: null,
          allAnalyses: [],
        });

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

        mappingsAdapter.removeOne(state.analysisMappings, id);
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
    removeBreakpoints() {
      return initialBreakpointsState();
    },

    analysisCreated(
      state,
      action: PayloadAction<{ analysisId: string; location: Location; condition?: string }>
    ) {
      const { analysisId, location, condition } = action.payload;

      analysesAdapter.addOne(state.analyses, {
        error: undefined,
        id: analysisId,
        location,
        condition,
        points: undefined,
        results: undefined,
        status: AnalysisStatus.Created,
      });

      const locationKey = getLocationKey(location);
      const mapping = state.analysisMappings.entities[locationKey];
      if (mapping) {
        mapping.allAnalyses.push(analysisId);
        mapping.currentAnalysis = analysisId;
      }
    },
    analysisPointsRequested(state, action: PayloadAction<string>) {
      const analysisId = action.payload;
      const analysis = state.analyses.entities[analysisId];
      if (!analysis) {
        return;
      }
      analysis.status = AnalysisStatus.LoadingPoints;

      const locationKey = getLocationKey(analysis.location);
      mappingsAdapter.updateOne(state.analysisMappings, {
        id: locationKey,
        changes: { currentAnalysis: analysisId },
      });
    },
    analysisPointsReceived(
      state,
      action: PayloadAction<{ analysisId: string; points: PointDescription[] }>
    ) {
      const { analysisId, points } = action.payload;
      const analysis = state.analyses.entities[analysisId];
      if (!analysis) {
        return;
      }
      analysis.points = points;
      analysis.status = AnalysisStatus.PointsRetrieved;

      const locationKey = getLocationKey(analysis.location);
      mappingsAdapter.updateOne(state.analysisMappings, {
        id: locationKey,
        changes: { lastSuccessfulAnalysis: analysisId },
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
      const analysis = state.analyses.entities[analysisId];
      if (!analysis) {
        return;
      }

      // Preemptively freeze the `results` array to keep Immer from recursively freezing,
      // because we have mutable class instances nested inside (EW!)
      Object.freeze(results);

      analysis.results = results;
      analysis.status = AnalysisStatus.Completed;

      const locationKey = getLocationKey(analysis.location);
      mappingsAdapter.updateOne(state.analysisMappings, {
        id: locationKey,
        changes: { lastSuccessfulAnalysis: analysisId },
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
      if (!analysis) {
        return;
      }

      const currentStatus = analysis.status;
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
          points: isLoadingPoints ? points : analysis.points,
          results: isLoadingResults ? results : analysis.results,
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

export type LocationAnalysisPoints = {
  data: PointDescription[];
  error: AnalysisError | undefined;
};

export const getAnalysisPointsForLocation = createSelector(
  [
    (state: UIState) => state.breakpoints.analysisMappings,
    (state: UIState) => state.breakpoints.analyses,
    (state: UIState) => state.timeline.focusRegion,
    (state: UIState, location: Location | null) => location,
    (state: UIState, location: Location | null, condition: string | null = "") => condition,
  ],
  (
    analysisMappings,
    analyses,
    focusRegion,
    location,
    condition
  ): LocationAnalysisPoints | undefined => {
    // First, verify that we have a real location, and a breakpoint mapping for that location
    if (!location) {
      return undefined;
    }

    const locationKey = getLocationKey(location);
    const mappingEntry = analysisMappings.entities[locationKey];

    if (!mappingEntry) {
      return undefined;
    }

    const matchingEntries: AnalysisSummary[] = [];

    // Next, filter down all analysis runs for this location, based on matching
    // against the `condition` the user supplied, as well as whether we
    // actually legitimately found points
    mappingEntry.allAnalyses.forEach(analysisId => {
      const analysisEntry = analyses.entities[analysisId];
      // TODO Double-check undefined vs empty string conditions here
      if (!analysisEntry || (analysisEntry.condition ?? "") !== condition) {
        return;
      }

      // TODO Are we sure about the error statuses here?
      const hasPoints = [
        // Successful queries
        AnalysisStatus.PointsRetrieved,
        AnalysisStatus.Completed,
        // Presumably got points first
        AnalysisStatus.LoadingResults,
        // Should have at least come back with _some_ points
        AnalysisStatus.ErroredGettingPoints,
        AnalysisStatus.ErroredRunning,
      ].includes(analysisEntry.status);

      if (hasPoints) {
        matchingEntries.push(analysisEntry);
      }
    });

    if (matchingEntries.length === 0) {
      // We have no hits available
      return undefined;
    }

    const allPoints = matchingEntries.map(entry => entry.points!).flat();
    const uniquePoints = uniqBy(allPoints, item => item.point);
    uniquePoints.sort((a, b) => compareNumericStrings(a.point, b.point));

    const finalPoints = focusRegion ? filterToFocusRegion(uniquePoints, focusRegion) : uniquePoints;

    // Meanwhile, we're going to use the _latest_ analysis run's status
    // for display purposes.
    const latestAnalysisEntry = analyses.entities[mappingEntry.currentAnalysis!];

    // TODO What's a good default here?
    let error: AnalysisError | undefined = latestAnalysisEntry?.error;

    return {
      data: finalPoints,
      error,
    };
  },
  {
    memoizeOptions: {
      // Arbitrary number for cache size
      maxSize: 50,
    },
  }
);

const getHoveredLineNumberLocation = (state: UIState) => state.app.hoveredLineNumberLocation;

export const getPointsForHoveredLineNumber = (state: UIState) => {
  const location = getHoveredLineNumberLocation(state);
  return getAnalysisPointsForLocation(state, location);
};
