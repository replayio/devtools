import { AnalysisEntry, Location, PointDescription } from "@replayio/protocol";
import { ThreadFront } from "protocol/thread";
import { AnalysisParams } from "../analysisManager";
import { client, gAnalysisCallbacks } from "../socket";

export const MAX_POINTS_FOR_FULL_ANALYSIS = 200;

export interface Analysis {
  analysisId: string;
  addLocation: (location: Location) => Promise<void>;
  findPoints: () => Promise<FindAnalysisPointsResult>;
  runAnalysis: () => Promise<RunAnalysisResult>;
  releaseAnalysis: () => Promise<void>;
}

export enum AnalysisError {
  TooManyPointsToFind = "too-many-points-to-find",
  TooManyPointsToRun = "too-many-points-to-run",
  Unknown = "unknown",
}

interface FindAnalysisPointsResult {
  points: PointDescription[];
  error: AnalysisError.TooManyPointsToFind | undefined;
}

interface RunAnalysisResult {
  results: AnalysisEntry[];
  error: AnalysisError.TooManyPointsToRun | undefined;
}

export const createAnalysis = async (
  params: Omit<AnalysisParams, "locations">
): Promise<Analysis> => {
  // Call to the client and say hey please make an analysis and after that
  // create an Analysis with that result
  const sessionId = await ThreadFront.waitForSession();
  const protocolParams: Omit<AnalysisParams, "sessionId"> = {
    mapper: params.mapper,
    reducer: params.reducer,
    effectful: params.effectful,
  };
  if (params.range) {
    protocolParams.range = params.range;
  }
  const { analysisId } = await client.Analysis.createAnalysis(protocolParams, sessionId);
  const points: PointDescription[] = [];
  const results: AnalysisEntry[] = [];
  gAnalysisCallbacks.set(analysisId, {
    onEvent: receivedPoints => {
      points.push(...receivedPoints);
    },
    onCreate: () => {},
    onResults: receivedResults => {
      results.push(...receivedResults);
    },
  });
  return {
    analysisId,
    async findPoints() {
      try {
        await client.Analysis.findAnalysisPoints({ analysisId }, sessionId);
        await ThreadFront.ensureAllSources();
        points.forEach(point => ThreadFront.updateMappedLocation(point.frame));
        return {
          points,
          error: undefined,
        };
      } catch {
        return {
          points,
          error: AnalysisError.TooManyPointsToFind,
        };
      }
    },
    async addLocation(location: Location) {
      await client.Analysis.addLocation({ analysisId, location }, sessionId);
      return;
    },
    async runAnalysis() {
      try {
        await client.Analysis.runAnalysis({ analysisId }, sessionId);
        return {
          results,
          error: undefined,
        };
      } catch {
        return {
          results,
          error: AnalysisError.TooManyPointsToRun,
        };
      }
    },
    async releaseAnalysis() {
      await client.Analysis.releaseAnalysis({ analysisId }, sessionId);
      gAnalysisCallbacks.delete(analysisId);
      return;
    },
  };
};
