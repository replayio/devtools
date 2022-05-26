import {
  analysisError,
  analysisResult,
  Location,
  PointDescription,
  AnalysisEntry,
} from "@replayio/protocol";
import { createEntityAdapter, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { AnalysisError } from "protocol/thread/analysis";

enum AnalysisStatus {
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
  points: PointDescription[] | undefined;
  // Do we want to store results here? I guess so? They can be a bit
  // unweildy I think, but I expect they will be serializable.
  results: AnalysisEntry[] | undefined;
  status: AnalysisStatus;
};

export const analysesAdapter = createEntityAdapter<AnalysisSummary>();

const initialState = analysesAdapter.getInitialState();
export type AnalysesState = typeof initialState;

const analysesSlice = createSlice({
  initialState,
  name: "analyses",
  reducers: {
    analysisCreated(state, action: PayloadAction<string>) {
      analysesAdapter.addOne(state, {
        error: undefined,
        id: action.payload,
        location: undefined,
        points: undefined,
        results: undefined,
        status: AnalysisStatus.Created,
      });
    },
    analysisPointsRequested(state, action: PayloadAction<string>) {
      analysesAdapter.updateOne(state, {
        id: action.payload,
        changes: { status: AnalysisStatus.LoadingPoints },
      });
    },
    analysisPointsReceived(
      state,
      action: PayloadAction<{ analysisId: string; points: PointDescription[] }>
    ) {
      analysesAdapter.updateOne(state, {
        id: action.payload.analysisId,
        changes: {
          points: action.payload.points,
          status: AnalysisStatus.PointsRetrieved,
        },
      });
    },
    analysisResultsRequested(state, action: PayloadAction<string>) {
      analysesAdapter.updateOne(state, {
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

      analysesAdapter.updateOne(state, {
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

      const analysis = state.entities[analysisId];
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

      analysesAdapter.updateOne(state, {
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
} = analysesSlice.actions;

export default analysesSlice.reducer;
