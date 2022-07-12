import {
  createSlice,
  createEntityAdapter,
  createSelector,
  PayloadAction,
  EntityState,
} from "@reduxjs/toolkit";
import {
  AnalysisEntry,
  Location,
  PointDescription,
  TimeStampedPointRange,
} from "@replayio/protocol";
import type {
  Breakpoint as OriginalBreakpointType,
  BreakpointOptions,
  StableLocation,
} from "devtools/client/debugger/src/reducers/types";
import { AnalysisError, MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/thread/analysis";
import { isLogpoint, isMatchingLocation } from "devtools/client/debugger/src/utils/breakpoint";
import { getSelectedSource, getStableLocationForLocation, LoadingState } from "./sources";
import { getLocationKey } from "./possibleBreakpoints";
import { UIState } from "ui/state";
import { FocusRegion } from "ui/state/timeline";
import { filterToFocusRegion, isFocusRegionSubset } from "ui/utils/timeline";
import uniqBy from "lodash/uniqBy";
import { compareNumericStrings } from "protocol/utils";
import { UIThunkAction } from "ui/actions";
import { setMultiSourceLogpoint } from "ui/actions/logpoint";

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

export interface Breakpoint extends OriginalBreakpointType {
  status: LoadingState;
  error?: string;
}

export type AnalysisRequest = {
  error: AnalysisError | undefined;
  id: string;
  // We wrote this a little while ago, before `StableLocation` meant anything,
  // but it would probably be best to use that type here instead
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

/**
 * A note on terminology:
 * - Breakpoints are a familiar concept in debuggers. Execution will pause when
 * it reaches that point and the user can use step commands, etc.
 * - Logpoints (or Print Statements) are a slightly different thing. Rather than
 * pausing execution, logpoints will add console.log statements as if they had
 * existed at each point in the recording when that breakpoint *would have*
 * paused. We use the gutter UI to manage both of these, so it's easy to get
 * confused what each thing is.
 *
 * Also, there is a massive difference in the way that these things work under
 * the hood. Breakpoints work kind of how you might expect, we tell the backend
 * to set a breakpoint at the requested point, and execution will pause there
 * when we hit it while replaying. Logpoints, however, look nothing like this.
 * Instead, logpoints are generated using the Analysis API. We create an
 * analysis, add the location of the logpoint, and then evaluate the expression
 * that the user gives us at each of the points returned by that analysis.
 * That's why you see a mixture of breakpoint and analysis data stored here
 * together and mapped onto each other.
 *
 * Other than in this comment, there is no mention of Logpoints in this file.
 * That's because Breakpoints and Logpoints have so much overlap conceptually
 * and in the UI that we store them together. So a Breakpoint is generally a
 * combination Breakpoint and Logpoint. If it is has `logValue` set to true, it
 * is a Logpoint. If it has `shouldPause` set to true, it's a Breakpoint. If it
 * has both, then it serves both purposes. If it has neither, then something is
 * broken, and it's your job to fix it! (or at least file an issue) ;-)
 */
export interface BreakpointsState {
  /**
   * Breakpoints, ids come from a StableLocation, meaning they are immune to
   * changes in sourceIds across sessions
   */
  breakpoints: EntityState<Breakpoint>;
  /**
   * Analysis entries associated with breakpoints, keyed by GUID.
   */
  analyses: EntityState<AnalysisRequest>;
  /**
   * Maps between a location string and analysis IDs for that location
   */
  analysisMappings: EntityState<BreakpointAnalysisMapping>;
}

const breakpointsAdapter = createEntityAdapter<Breakpoint>();
const analysesAdapter = createEntityAdapter<AnalysisRequest>();
const mappingsAdapter = createEntityAdapter<BreakpointAnalysisMapping>({
  selectId: entry => entry.locationId,
});

export function initialBreakpointsState(): BreakpointsState {
  return {
    breakpoints: breakpointsAdapter.getInitialState(),
    analyses: analysesAdapter.getInitialState(),
    analysisMappings: mappingsAdapter.getInitialState(),
  };
}

const breakpointsSlice = createSlice({
  name: "breakpoints",
  initialState: initialBreakpointsState,
  reducers: {
    breakpointRequested(
      state,
      action: PayloadAction<{ location: StableLocation; options: BreakpointOptions }>
    ) {
      const id = getLocationKey(action.payload.location);
      const breakpoint: Breakpoint = {
        disabled: false,
        id,
        status: LoadingState.LOADING,
        ...action.payload,
      };
      breakpointsAdapter.upsertOne(state.breakpoints, breakpoint);
      if (action.payload.options.logValue) {
        mappingsAdapter.addOne(state.analysisMappings, {
          locationId: id,
          currentAnalysis: null,
          lastSuccessfulAnalysis: null,
          allAnalyses: [],
        });
      }
    },
    breakpointCreated(
      state,
      action: PayloadAction<{ location: StableLocation; serverId: string }>
    ) {
      const id = getLocationKey(action.payload.location);
      breakpointsAdapter.updateOne(state.breakpoints, {
        id,
        changes: {
          serverId: action.payload.serverId,
          error: undefined,
          status: LoadingState.LOADED,
        },
      });
    },
    breakpointErrored(state, action: PayloadAction<{ location: StableLocation; error: string }>) {
      const id = getLocationKey(action.payload.location);
      breakpointsAdapter.updateOne(state.breakpoints, {
        id,
        changes: {
          error: "",
          status: LoadingState.ERRORED,
        },
      });
    },
    breakpointRemoved(state, action: PayloadAction<Location>) {
      const id = getLocationKey(action.payload);
      breakpointsAdapter.removeOne(state.breakpoints, id);
      mappingsAdapter.removeOne(state.analysisMappings, id);
    },
    allBreakpointsRemoved() {
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
  allBreakpointsRemoved,
  analysisCreated,
  analysisErrored,
  analysisPointsReceived,
  analysisPointsRequested,
  analysisResultsReceived,
  analysisResultsRequested,
  breakpointCreated,
  breakpointErrored,
  breakpointRemoved,
  breakpointRequested,
} = breakpointsSlice.actions;

export const { selectAll: selectAllBreakpoints } = breakpointsAdapter.getSelectors();

export default breakpointsSlice.reducer;

// Selectors
export function getBreakpointsList(state: UIState) {
  return breakpointsAdapter.getSelectors().selectAll(state.breakpoints.breakpoints);
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

  return state.breakpoints.breakpoints.entities[getLocationKey(location)];
}

export function getBreakpointsDisabled(state: UIState) {
  const breakpoints = getBreakpointsList(state);
  return breakpoints.every(breakpoint => breakpoint.disabled);
}

export const getBreakpointsForSelectedSource = createSelector(
  getBreakpointsList,
  getSelectedSource,
  (breakpoints, selectedSource) => {
    if (!selectedSource) {
      return [];
    }

    const sourceId = selectedSource.id;
    return breakpoints.filter(bp => {
      return bp.location.sourceId === sourceId;
    });
  }
);

export function addBreakpoint(
  location: Location,
  options: Partial<BreakpointOptions> = {}
): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    const stableLocation = getStableLocationForLocation(getState(), location);
    const combinedOptions = {
      shouldPause: false,
      logGroupId: getLocationKey(stableLocation),
      ...options,
    };
    dispatch(breakpointRequested({ location: stableLocation, options: combinedOptions }));
    if (combinedOptions.shouldPause) {
      await ThreadFront.setBreakpoint(
        location.sourceId,
        location.line,
        location.column,
        combinedOptions.condition || undefined
      );
    }
    if (combinedOptions.logValue) {
      const sourceIds = ThreadFront.getCorrespondingSourceIds(location.sourceId);
      const { line, column } = location;
      const locations = sourceIds.map(sourceId => ({ sourceId, line, column }));
      dispatch(
        setMultiSourceLogpoint(
          combinedOptions.logGroupId!,
          locations,
          combinedOptions.logValue,
          combinedOptions.condition || ""
        )
      );
    }
    // I don't think we get the server ID back from threadfront. I don't think
    // we really need it though.
    dispatch(breakpointCreated({ location: stableLocation, serverId: "unknown" }));
  };
}

export function setBreakpointOptions(
  location: Location,
  options: Partial<BreakpointOptions>
): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    const key = getLocationKey(location);
    const existing = getState().breakpoints.breakpoints.entities[key];
    if (!existing) {
      return;
    }

    const combinedOptions = {
      ...existing.options,
      ...options,
    };
    breakpointsAdapter.updateOne(getState().breakpoints.breakpoints, {
      id: key,
      changes: { options: combinedOptions },
    });

    if (combinedOptions.logValue) {
      const sourceIds = ThreadFront.getCorrespondingSourceIds(location.sourceId);
      const { line, column } = location;
      const locations = sourceIds.map(sourceId => ({ sourceId, line, column }));
      dispatch(
        setMultiSourceLogpoint(
          combinedOptions.logGroupId!,
          locations,
          combinedOptions.logValue!,
          combinedOptions.condition || ""
        )
      );
    }
  };
}

export function removeBreakpoint(location: Location): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    await ThreadFront.removeBreakpoint(location.sourceId, location.line, location.column);
    dispatch(breakpointRemoved(location));
  };
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

export function getBreakpointForLocation(state: UIState, location?: StableLocation) {
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

const customAnalysisResultComparator = (
  a: LocationAnalysisSummary | undefined,
  b: LocationAnalysisSummary | undefined
) => {
  if (!a && !b) {
    // Both undefined is the same
    return true;
  } else if (!a || !b) {
    // Only one undefined is different
    return false;
  }
  const d1 = a.data;
  const d2 = b.data;

  // Verify that all point entries have identical sorted point/time values
  let dataEqual =
    d1.length === d2.length &&
    d1.every((item, i) => {
      const otherItem = d2[i];
      const pointEqual = item.point === otherItem.point;
      const timeEqual = item.time === otherItem.time;
      return pointEqual && timeEqual;
    });

  const errorEqual = a.error === b.error;
  const statusEqual = a.status === b.status;
  const result = dataEqual && errorEqual && statusEqual;

  return result;
};

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

/**
 * Retrieves a unique sorted set of hit points for a given location based on analysis runs.
 * If there is no breakpoint active for the location or no analysis run, returns `undefined`.
 * Otherwise, returns the array of hit points, plus the `status/condition/error` from
 * the latest analysis run.
 */
export const getAnalysisPointsForLocation = createSelector(
  [
    getAnalysisMappingForLocation,
    (state: UIState) => state.breakpoints.analyses,
    (state: UIState) => state.timeline.focusRegion,
    (state: UIState, location: Location | null, condition: string | null = "") => condition,
  ],
  (mappingEntry, analyses, focusRegion, condition): LocationAnalysisSummary | undefined => {
    // First, verify that we have a real location and a breakpoint mapping for that location
    if (!mappingEntry) {
      return undefined;
    }

    // We're going to use the _latest_ analysis run's status for display purposes.
    const latestAnalysisEntry = analyses.entities[mappingEntry.currentAnalysis!];

    if (!latestAnalysisEntry) {
      return undefined;
    }

    const matchingEntries: AnalysisRequest[] = [];

    // Next, filter down all analysis runs for this location, based on matching
    // against the `condition` the user supplied, as well as whether we
    // actually legitimately found points
    mappingEntry.allAnalyses.forEach(analysisId => {
      const analysisEntry = analyses.entities[analysisId];
      // TODO Double-check undefined vs empty string conditions here
      if (!analysisEntry || (analysisEntry.condition ?? "") !== condition) {
        return;
      }

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

    let finalPoints: PointDescription[] = [];

    if (matchingEntries.length === 0) {
      return undefined;
    }

    const pointsPerEntry = matchingEntries.map(entry => {
      const { points = [], results = [] } = entry;
      if (condition && entry.status === AnalysisStatus.Completed) {
        // Currently the backend does not filter returned points by condition, only analysis results.
        // If there _is_ a condition, _and_ we have results back, we should filter the total points
        // based on the analysis results.
        const resultPointsSet = new Set<string>(results.map(result => result.key));
        const filteredConditionPoints = points.filter(point => resultPointsSet.has(point.point));
        return filteredConditionPoints;
      }

      return points;
    });

    const flattenedPoints = pointsPerEntry.flat();
    const uniquePoints = uniqBy(flattenedPoints, item => item.point);
    uniquePoints.sort((a, b) => compareNumericStrings(a.point, b.point));

    // TODO `filterToFocusRegion` wants a pre-sorted array, but maybe a bit cheaper to filter first _then_ sort?
    finalPoints = focusRegion ? filterToFocusRegion(uniquePoints, focusRegion) : uniquePoints;

    const {
      analysisLoaded,
      analysisErrored,
      isFocusSubset,
      analysisOverflowed,
      hasAllDataForFocusRegion,
    } = getStatusFlagsForAnalysisEntry(latestAnalysisEntry, focusRegion);

    return {
      data: finalPoints,
      error: latestAnalysisEntry.error,
      status: latestAnalysisEntry.status,
      condition: latestAnalysisEntry.condition,
      isCompleted: hasAllDataForFocusRegion,
    };
  },
  {
    memoizeOptions: {
      // Arbitrary number for cache size
      maxSize: 100,
      // Reuse old result if contents are the same
      resultEqualityCheck: customAnalysisResultComparator,
    },
  }
);

const getHoveredLineNumberLocation = (state: UIState) => state.app.hoveredLineNumberLocation;

export const getPointsForHoveredLineNumber = (state: UIState) => {
  const location = getHoveredLineNumberLocation(state);
  return getAnalysisPointsForLocation(state, location);
};
