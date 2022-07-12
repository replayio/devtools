import { EntityState } from "@reduxjs/toolkit";
import { AnalysisEntry, PointDescription, TimeStampedPointRange } from "@replayio/protocol";
import { Breakpoint } from "devtools/client/debugger/src/reducers/types";
import { AnalysisError } from "protocol/thread/analysis";
import { LoadingState } from "./breakableLines";

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
  breakpoints: EntityState<{
    breakpoint: Breakpoint;
    id: string;
    status: LoadingState;
  }>;
  /**
   * Analysis entries associated with breakpoints, keyed by GUID.
   */
  analyses: EntityState<AnalysisRequest>;
  /**
   * Maps between a location string and analysis IDs for that location
   */
  analysisMappings: EntityState<BreakpointAnalysisMapping>;
}
