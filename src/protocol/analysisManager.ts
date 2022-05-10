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
  SessionId,
} from "@recordreplay/protocol";
import { sendMessage, addEventListener } from "protocol/socket";
import { ThreadFront } from "protocol/thread";

import { assert } from "./utils";

export interface AnalysisParams {
  effectful: boolean;
  eventHandlerEntryPoints?: EventHandlerEntryPoint[];
  exceptionPoints?: boolean;
  functionEntryPoints?: FunctionEntryPoint[];
  locations?: AnalysisLocation[];
  mapper: string;
  points?: ExecutionPoint[];
  randomPoints?: number;
  reducer?: string;
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

      if (params.randomPoints) {
        await sendMessage(
          "Analysis.addRandomPoints",
          { analysisId, numPoints: params.randomPoints },
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
