import {
  addEventHandlerEntryPointsParameters,
  addFunctionEntryPointsParameters,
  addLocationParameters,
  AnalysisEntry,
  analysisError,
  AnalysisId,
  analysisPoints,
  analysisResult,
  ExecutionPoint,
  PointDescription,
  PointRange,
  SessionId,
} from "@replayio/protocol";
import { sendMessage, addEventListener } from "protocol/socket";
import { ThreadFront } from "protocol/thread";

import { assert } from "./utils";

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

  // The session this command is associated with, e.g. ThreadFront.sessionId.
  sessionId: SessionId;
}

type OmitParams = "analysisId" | "sessionId";
export type AnalysisLocation = Omit<addLocationParameters, OmitParams>;
export type FunctionEntryPoint = Omit<addFunctionEntryPointsParameters, OmitParams>;
export type EventHandlerEntryPoint = Omit<addEventHandlerEntryPointsParameters, OmitParams>;

export interface AnalysisHandler<T> {
  onAnalysisError?: (error: string) => void;
  onAnalysisPoints?: (points: PointDescription[]) => void;
  onAnalysisResult?: (result: AnalysisEntry[]) => void;
  onFinished?(): T;
}

// When running analyses in batches, limit on the points to use in each batch.
const MaxPointsPerBatch = 200;

class AnalysisManager {
  private handlers = new Map<AnalysisId, AnalysisHandler<any>>();

  init() {
    addEventListener("Analysis.analysisResult", this.onAnalysisResult);
    addEventListener("Analysis.analysisPoints", this.onAnalysisPoints);
    addEventListener("Analysis.analysisError", this.onAnalysisError);
  }

  async runAnalysis<T>(params: AnalysisParams, handler: AnalysisHandler<T>) {
    await ThreadFront.ensureAllSources();
    const { analysisId } = await sendMessage(
      "Analysis.createAnalysis",
      {
        mapper: params.mapper,
        reducer: params.reducer,
        effectful: params.effectful,
      },
      params.sessionId
    );

    try {
      if (params.locations) {
        await Promise.all(
          params.locations.map(loc =>
            sendMessage("Analysis.addLocation", { analysisId, ...loc }, params.sessionId)
          )
        );
      }

      if (params.functionEntryPoints) {
        await Promise.all(
          params.functionEntryPoints.map(fep =>
            sendMessage("Analysis.addFunctionEntryPoints", { analysisId, ...fep }, params.sessionId)
          )
        );
      }

      if (params.eventHandlerEntryPoints) {
        await Promise.all(
          params.eventHandlerEntryPoints.map(ehep =>
            sendMessage(
              "Analysis.addEventHandlerEntryPoints",
              { analysisId, ...ehep },
              params.sessionId
            )
          )
        );
      }

      if (params.exceptionPoints) {
        await sendMessage("Analysis.addExceptionPoints", { analysisId }, params.sessionId);
      }

      if (params.numRandomPoints) {
        await sendMessage(
          "Analysis.addRandomPoints",
          { analysisId, numPoints: params.numRandomPoints },
          params.sessionId
        );
      }

      if (params.points) {
        await sendMessage(
          "Analysis.addPoints",
          { analysisId, points: params.points },
          params.sessionId
        );
      }

      this.handlers.set(analysisId, handler);
      await Promise.all([
        !handler.onAnalysisResult ||
          sendMessage("Analysis.runAnalysis", { analysisId }, params.sessionId),
        !handler.onAnalysisPoints ||
          sendMessage("Analysis.findAnalysisPoints", { analysisId }, params.sessionId),
      ]);
    } finally {
      this.handlers.delete(analysisId);
      await sendMessage("Analysis.releaseAnalysis", { analysisId }, params.sessionId);
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
        sessionId: params.sessionId,
        mapper: params.mapper,
        effectful: true,
        points: batchPoints.map(p => p.point),
      };

      await this.runAnalysis(batchParams, handler);
    }
  }

  private readonly onAnalysisResult = ({ analysisId, results }: analysisResult) => {
    const handler = this.handlers.get(analysisId);
    assert(handler, "no handler for given analysisId");
    handler.onAnalysisResult?.(results);
  };

  private readonly onAnalysisPoints = ({ analysisId, points }: analysisPoints) => {
    const handler = this.handlers.get(analysisId);
    assert(handler, "no handler for given analysisId");
    points.forEach(point => ThreadFront.updateMappedLocation(point.frame));
    handler.onAnalysisPoints?.(points);
  };

  private readonly onAnalysisError = ({ analysisId, error }: analysisError) => {
    const handler = this.handlers.get(analysisId);
    assert(handler, "no handler for given analysisId");
    handler.onAnalysisError?.(error);
  };
}

export default new AnalysisManager();
