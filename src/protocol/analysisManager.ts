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
    const { analysisId } = await sendMessage("Analysis.createAnalysis", {
      mapper: params.mapper,
      reducer: params.reducer,
      effectful: params.effectful,
    });

    if (params.locations) {
      await Promise.all(
        params.locations.map(loc =>
          sendMessage("Analysis.addLocation", {
            sessionId: params.sessionId,
            analysisId,
            ...loc,
          })
        )
      );
    }

    if (params.functionEntryPoints) {
      await Promise.all(
        params.functionEntryPoints.map(fep =>
          sendMessage("Analysis.addFunctionEntryPoints", {
            sessionId: params.sessionId,
            analysisId,
            ...fep,
          })
        )
      );
    }

    if (params.eventHandlerEntryPoints) {
      await Promise.all(
        params.eventHandlerEntryPoints.map(ehep =>
          sendMessage("Analysis.addEventHandlerEntryPoints", {
            sessionId: params.sessionId,
            analysisId,
            ...ehep,
          })
        )
      );
    }

    if (params.exceptionPoints) {
      await sendMessage("Analysis.addExceptionPoints", {
        sessionId: params.sessionId,
        analysisId,
      });
    }

    if (params.randomPoints) {
      await sendMessage("Analysis.addRandomPoints", {
        sessionId: params.sessionId,
        analysisId,
        numPoints: params.randomPoints,
      });
    }

    this.handlers.set(analysisId, handler);
    const promise = sendMessage("Analysis.runAnalysis", { analysisId });
    if (handler.onAnalysisPoints) {
      sendMessage("Analysis.findAnalysisPoints", { analysisId });
    }
    await promise;
    await sendMessage("Analysis.releaseAnalysis", { analysisId });
    this.handlers.delete(analysisId);

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
