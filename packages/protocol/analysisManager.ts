import {
  AnalysisEntry,
  AnalysisId,
  ExecutionPoint,
  PointDescription,
  PointRange,
  TimeStampedPoint,
  addEventHandlerEntryPointsParameters,
  addFunctionEntryPointsParameters,
  addLocationParameters,
  analysisError,
  analysisPoints,
  analysisResult,
} from "@replayio/protocol";

import { addEventListener } from "protocol/socket";
import { ThreadFront } from "protocol/thread";
import { preCacheExecutionPointForTime } from "replay-next/src/suspense/ExecutionPointsCache";

import { client } from "./socket";

export const MAX_POINTS_FOR_FULL_ANALYSIS = 200;

// For more information about these params, see:
// https://static.replay.io/protocol/tot/Analysis
export interface AnalysisParams {
  // Whether effectful commands in the Pause domain might be sent by the mapper function.
  // An analysis which does not use effectful commands will run more efficiently.
  // See the Pause domain for which commands are effectful.
  effectful: boolean;

  // Apply the analysis to the entry point of every handler for an each of these event types.
  eventHandlerEntryPoints?: EventHandlerEntryPoint[];

  // Apply the analysis to every point where an exception is thrown.
  exceptionPoints?: boolean;

  // Apply the analysis to every function entry point in a region of a source.
  functionEntryPoints?: FunctionEntryPoint[];

  // Apply the analysis to every point where a these source locations execute.
  locations?: AnalysisLocation[];

  // Body of the mapper function.
  // The mapper function takes two arguments:
  // 1. input is a MapInput object.
  // 2. sendCommand is a function that can be passed a command name and parameters (in that order) and synchronously returns the command result.
  //
  // Only methods from the Pause domain may be used with sendCommand.
  // The mapper function must return an array of AnalysisEntry objects.
  //
  // e.g. "return [{ key: input.point, value: input }];"
  // e.g. "return [];"
  mapper: string;

  // Apply the analysis to a random selection of points.
  // This param specifies the number of random points to use.
  numRandomPoints?: number;

  // Apply the analysis to this specific set of points.
  points?: ExecutionPoint[];

  range?: PointRange;

  // Body of the reducer function.
  // The reducer function takes two arguments:
  // 1. key is an AnalysisKey
  // 2. values is an array of AnalysisValue
  //
  // All the values were associated with the key by an earlier call to mapper or reducer.
  // The reducer function must return an AnalysisValue,
  // which summarizes all the input values and will be associated with key for analysisResult events or further calls to the reducer.
  // The reducer may be omitted if no reduction phase is needed.
  reducer?: string;
}

type OmitParams = "analysisId";
export type AnalysisLocation = Omit<addLocationParameters, OmitParams>;
export type FunctionEntryPoint = Omit<addFunctionEntryPointsParameters, OmitParams>;
export type EventHandlerEntryPoint = Omit<addEventHandlerEntryPointsParameters, OmitParams>;

export interface AnalysisHandler<T> {
  onAnalysisError?: (error: unknown) => void;
  onAnalysisPoints?: (points: PointDescription[]) => void;
  onAnalysisResult?: (result: AnalysisEntry[]) => void;
  onFinished?(): T;
}

// When running analyses in batches, limit on the points to use in each batch.
const MaxPointsPerBatch = MAX_POINTS_FOR_FULL_ANALYSIS;

let onPointsReceived: (points: TimeStampedPoint[]) => void;
export function setPointsReceivedCallback(callback: typeof onPointsReceived): void {
  onPointsReceived = callback;
}

class AnalysisManager {
  private handlers = new Map<AnalysisId, AnalysisHandler<any>>();
  private initialized = false;

  init() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    addEventListener("Analysis.analysisResult", this.onAnalysisResult);
    addEventListener("Analysis.analysisPoints", this.onAnalysisPoints);
    addEventListener("Analysis.analysisError", this.onAnalysisError);
  }

  async runAnalysis<T>(params: AnalysisParams, handler: AnalysisHandler<T>) {
    await ThreadFront.ensureAllSources();
    const sessionId = await ThreadFront.waitForSession();
    const { analysisId } = await client.Analysis.createAnalysis(
      {
        mapper: params.mapper,
        reducer: params.reducer,
        effectful: params.effectful,
        range: params.range,
      },
      sessionId
    );

    try {
      if (params.locations) {
        await Promise.all(
          params.locations.map(loc =>
            client.Analysis.addLocation({ analysisId, ...loc }, sessionId)
          )
        );
      }

      if (params.functionEntryPoints) {
        await Promise.all(
          params.functionEntryPoints.map(fep =>
            client.Analysis.addFunctionEntryPoints({ analysisId, ...fep }, sessionId)
          )
        );
      }

      if (params.eventHandlerEntryPoints) {
        await Promise.all(
          params.eventHandlerEntryPoints.map(ehep =>
            client.Analysis.addEventHandlerEntryPoints({ analysisId, ...ehep }, sessionId)
          )
        );
      }

      if (params.exceptionPoints) {
        await client.Analysis.addExceptionPoints({ analysisId }, sessionId);
      }

      if (params.numRandomPoints) {
        await client.Analysis.addRandomPoints(
          { analysisId, numPoints: params.numRandomPoints },
          sessionId
        );
      }

      if (params.points) {
        await client.Analysis.addPoints({ analysisId, points: params.points }, sessionId);
      }

      this.handlers.set(analysisId, handler);
      await Promise.all([
        !handler.onAnalysisResult || client.Analysis.runAnalysis({ analysisId }, sessionId),
        !handler.onAnalysisPoints || client.Analysis.findAnalysisPoints({ analysisId }, sessionId),
      ]);
    } catch (e) {
      this.onAnalysisError({ analysisId, error: e instanceof Error ? e.message : "Unknown Error" });
      console.error(e);
    } finally {
      this.handlers.delete(analysisId);
      await client.Analysis.releaseAnalysis({ analysisId }, sessionId);
    }

    return handler.onFinished?.();
  }

  async runAnalysisBatches<T>(
    params: AnalysisParams,
    handler: AnalysisHandler<T>,
    maxPoints: number
  ) {
    assert(!handler.onAnalysisPoints, "There should be no onAnalysisPoints handler.");
    assert(handler.onAnalysisResult, "There should be an onAnalysisResults handler");

    const pointsHandler: AnalysisHandler<void> = {};
    const allPoints: PointDescription[] = [];

    pointsHandler.onAnalysisPoints = points => allPoints.push(...points);
    await this.runAnalysis(params, pointsHandler);

    const numPoints = Math.min(allPoints.length, maxPoints);

    for (let i = 0; i < numPoints; i += MaxPointsPerBatch) {
      const batchPoints = allPoints.slice(i, i + MaxPointsPerBatch);

      const batchParams: AnalysisParams = {
        mapper: params.mapper,
        effectful: true,
        points: batchPoints.map(p => p.point),
      };

      await this.runAnalysis(batchParams, handler);
    }
  }

  private readonly onAnalysisResult = ({ analysisId, results }: analysisResult) => {
    const handler = this.handlers.get(analysisId);
    if (handler != null && typeof handler.onAnalysisResult === "function") {
      handler.onAnalysisResult(results);
    }
  };

  private readonly onAnalysisPoints = ({ analysisId, points }: analysisPoints) => {
    if (typeof onPointsReceived === "function") {
      onPointsReceived(points);
    }
    const handler = this.handlers.get(analysisId);
    points.forEach(point => {
      preCacheExecutionPointForTime(point);
      if (handler != null && typeof handler.onAnalysisPoints === "function") {
        ThreadFront.updateMappedLocation(point.frame);
      }
    });
    if (handler != null && typeof handler.onAnalysisPoints === "function") {
      handler.onAnalysisPoints(points);
    }
  };

  private readonly onAnalysisError = ({ analysisId, error }: analysisError) => {
    const handler = this.handlers.get(analysisId);
    if (handler != null && typeof handler.onAnalysisError === "function") {
      handler.onAnalysisError(error);
    }
  };
}

export default new AnalysisManager();
