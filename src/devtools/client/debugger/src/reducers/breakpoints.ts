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
import {
  Location,
  PointDescription,
  AnalysisEntry,
  TimeStampedPointRange,
} from "@replayio/protocol";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import { AnalysisError, MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/thread/analysis";
import type { UIState } from "ui/state";
import { isFocusRegionSubset } from "ui/utils/timeline";

import { getBreakpointsList } from "../selectors/breakpoints";
import { getLocationKey, isMatchingLocation, isLogpoint } from "../utils/breakpoint";

import type { Breakpoint } from "./types";
import { FocusRegion } from "ui/state/timeline";
import { getSelectedLocation } from "ui/reducers/sources";
export type { Breakpoint } from "./types";

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

export type AnalysisRequest = {
  error: AnalysisError | undefined;
  id: string;
  location: Location;
  condition?: string;
  timeRange: TimeStampedPointRange | null;
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

export type LocationAnalysisSummary = {
  data: PointDescription[];
  error: AnalysisError | undefined;
  status: AnalysisStatus;
  condition?: string;
  isCompleted: boolean;
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
  requestedBreakpoints: Record<string, Location>;
  /**
   * Analysis entries associated with breakpoints, keyed by GUID.
   */
  analyses: EntityState<AnalysisRequest>;
  /**
   * Maps between a location string and analysis IDs for that location
   */
  analysisMappings: EntityState<BreakpointAnalysisMapping>;
}

const analysesAdapter = createEntityAdapter<AnalysisRequest>();
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
      reducer(
        state,
        action: PayloadAction<{ location: Location & { sourceUrl: string }; recordingId: string }>
      ) {
        const id = getLocationKey(action.payload.location);
        delete state.breakpoints[id];

        mappingsAdapter.removeOne(state.analysisMappings, id);
        delete state.requestedBreakpoints[id];
      },
      prepare(location: Location & { sourceUrl: string }, recordingId: string, cx?: Context) {
        // Add cx to action.meta
        return {
          payload: { location, recordingId },
          meta: { cx },
        };
      },
    },
    setRequestedBreakpoint(state, action: PayloadAction<Location>) {
      const location = action.payload;
      const requestedId = getLocationKey(location);
      state.requestedBreakpoints[requestedId] = location;
    },
    removeRequestedBreakpoint(state, action: PayloadAction<Location>) {
      const requestedId = getLocationKey(action.payload);
      delete state.requestedBreakpoints[requestedId];
    },
    removeBreakpoints() {
      return initialBreakpointsState();
    },

    analysisCreated(
      state,
      action: PayloadAction<{
        analysisId: string;
        location: Location;
        condition?: string;
        timeRange: TimeStampedPointRange | null;
      }>
    ) {
      const { analysisId, location, condition, timeRange } = action.payload;

      analysesAdapter.addOne(state.analyses, {
        error: undefined,
        id: analysisId,
        location,
        condition,
        timeRange,
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

export const getBreakpointsForSelectedSource = createSelector(
  getBreakpointsList,
  (state: UIState) => getSelectedLocation(state)?.sourceId,
  (breakpoints, sourceId) => {
    if (!sourceId) {
      return [];
    }

    return breakpoints.filter(bp => {
      return bp.location.sourceId === sourceId;
    });
  }
);

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

export const getAnalysisMappingForLocation = (state: UIState, location: Location | null) => {
  if (!location) {
    return undefined;
  }
  const locationKey = getLocationKey(location);
  return state.breakpoints.analysisMappings.entities[locationKey];
};

export const getStatusFlagsForAnalysisEntry = (
  analysisEntry: AnalysisRequest,
  focusRegion: FocusRegion | null
) => {
  const { error, timeRange, status, points = [] } = analysisEntry;

  const analysisErrored = [
    AnalysisError.TooManyPointsToFind,
    AnalysisError.TooManyPointsToRun,
  ].includes(error!);

  const analysisOverflowed =
    status === AnalysisStatus.PointsRetrieved && points.length > MAX_POINTS_FOR_FULL_ANALYSIS;

  const analysisLoaded = [AnalysisStatus.PointsRetrieved, AnalysisStatus.Completed].includes(
    status
  );

  const isFocusSubset = isFocusRegionSubset(timeRange, focusRegion);

  const hasAllDataForFocusRegion =
    analysisLoaded && !analysisErrored && !analysisOverflowed && isFocusSubset;

  return {
    analysisLoaded,
    analysisOverflowed,
    analysisErrored,
    isFocusSubset,
    hasAllDataForFocusRegion,
  };
};
