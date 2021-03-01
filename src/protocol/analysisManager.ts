import {
  addEventHandlerEntryPointsParameters,
  addFunctionEntryPointsParameters,
  addLocationParameters,
  AnalysisEntry,
  analysisError,
  AnalysisId,
  analysisPoints,
  analysisResult,
  PointDescription,
  SessionId,
} from "@recordreplay/protocol";
import { sendMessage, addEventListener } from "protocol/socket";
import { assert } from "./utils";

export interface AnalysisParams {
  mapper: string;
  reducer?: string;
  effectful: boolean;
  locations?: AnalysisLocation[];
  functionEntryPoints?: FunctionEntryPoint[];
  eventHandlerEntryPoints?: EventHandlerEntryPoint[];
  exceptionPoints?: boolean;
  randomPoints?: number;
  sessionId: SessionId;
}

type OmitParams = "analysisId" | "sessionId";
export type AnalysisLocation = Omit<addLocationParameters, OmitParams>;
export type FunctionEntryPoint = Omit<addFunctionEntryPointsParameters, OmitParams>;
export type EventHandlerEntryPoint = Omit<addEventHandlerEntryPointsParameters, OmitParams>;

export interface AnalysisHandler<T> {
  onAnalysisResult?: (result: AnalysisEntry[]) => void;
  onAnalysisPoints?: (points: PointDescription[]) => void;
  onAnalysisError?: (error: string) => void;
  onFinished?(): T;
}

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

  private readonly onAnalysisResult = ({ analysisId, results }: analysisResult) => {
    const handler = this.handlers.get(analysisId);
    assert(handler);
    handler.onAnalysisResult?.(results);
  };

  private readonly onAnalysisPoints = ({ analysisId, points }: analysisPoints) => {
    const handler = this.handlers.get(analysisId);
    assert(handler);
    handler.onAnalysisPoints?.(points);
  };

  private readonly onAnalysisError = ({ analysisId, error }: analysisError) => {
    const handler = this.handlers.get(analysisId);
    assert(handler);
    handler.onAnalysisError?.(error);
  };
}

export default new AnalysisManager();
