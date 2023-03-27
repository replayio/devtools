import { ExecutionPoint, PauseId, PointDescription, TimeStampedPoint } from "@replayio/protocol";
import { PointSelector, Value } from "@replayio/protocol";
import { Cache, IntervalCache, createExternallyManagedCache, createIntervalCache } from "suspense";

import { compareNumericStrings } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";

import { breakpointPositionsCache } from "./BreakpointPositionsCache";
import { objectPropertyCache } from "./ObjectPreviews";
import { cachePauseData, setPointAndTimeForPauseId } from "./PauseCache";

export const MAX_POINTS_FOR_FULL_ANALYSIS = 200;

export interface AnalysisParams {
  selector: PointSelector;
  expression: string;
  frameIndex?: number;
  fullPropertyPreview?: boolean;
}

export interface RemoteAnalysisResult {
  pauseId: PauseId;
  point: ExecutionPoint;
  time: number;
  values: Value[];
}

export interface AnalysisCache<T extends { point: ExecutionPoint }, TParams extends any[]> {
  pointsIntervalCache: IntervalCache<
    ExecutionPoint,
    [client: ReplayClientInterface, ...params: TParams],
    T
  >;
  resultsCache: Cache<[executionPoint: ExecutionPoint, ...params: TParams], RemoteAnalysisResult>;
}

export function createAnalysisCache<
  TPoint extends { point: ExecutionPoint },
  TParams extends any[]
>(
  debugLabel: string,
  getKey: (...params: TParams) => string,
  findPoints: (
    client: ReplayClientInterface,
    begin: ExecutionPoint,
    end: ExecutionPoint,
    ...params: TParams
  ) => Promise<PointDescription[]>,
  createEvaluationParams: (points: PointDescription[], ...params: TParams) => AnalysisParams,
  transformPoint: (point: PointDescription, ...params: TParams) => TPoint
): AnalysisCache<TPoint, TParams> {
  const resultsCache: Cache<
    [executionPoint: ExecutionPoint, ...params: TParams],
    RemoteAnalysisResult
  > = createExternallyManagedCache({
    debugLabel: `${debugLabel} Cache`,
    getKey: ([executionPoint, ...params]) => {
      const baseKey = getKey(...params);
      return `${baseKey}:${executionPoint}`;
    },
  });

  const pointsIntervalCache = createIntervalCache<
    ExecutionPoint,
    [client: ReplayClientInterface, ...params: TParams],
    TPoint
  >({
    debugLabel: `${debugLabel} IntervalCache`,
    getKey: (client, ...params) => getKey(...params),
    getPointForValue: pointDescription => pointDescription.point,
    comparePoints: compareNumericStrings,
    load: async (begin, end, client, ...paramsWithCacheLoadOptions) => {
      const params = paramsWithCacheLoadOptions.slice(0, -1) as TParams;
      const points = await findPoints(client, begin, end, ...params);
      onPointsReceived?.(points);

      const evaluationParams = createEvaluationParams(points, ...params);
      let allEvaluationParams = [evaluationParams];
      if (evaluationParams.selector.kind === "location") {
        const locations = client.getCorrespondingLocations(evaluationParams.selector.location);
        allEvaluationParams = locations.map(location => ({
          ...evaluationParams,
          location,
        }));
        await Promise.all(
          locations.map(location => breakpointPositionsCache.readAsync(client, location.sourceId))
        );
      }

      for (const evaluationParams of allEvaluationParams) {
        client.runEvaluation(
          {
            selector: evaluationParams.selector,
            expression: evaluationParams.expression,
            frameIndex: evaluationParams.frameIndex,
            fullPropertyPreview: evaluationParams.fullPropertyPreview,
            limits: { begin, end },
          },
          async results => {
            for (const result of results) {
              setPointAndTimeForPauseId(result.pauseId, result.point);
              cachePauseData(client, result.pauseId, result.data);

              const values: Value[] = [];
              if (result.exception) {
                values.push(result.exception);
              } else if (result.returned?.object) {
                const length =
                  (
                    await objectPropertyCache.readAsync(
                      client,
                      result.pauseId,
                      result.returned.object,
                      "length"
                    )
                  )?.value ?? 0;
                for (let i = 0; i < length; i++) {
                  const value = await objectPropertyCache.readAsync(
                    client,
                    result.pauseId,
                    result.returned.object,
                    String(i)
                  );
                  if (value) {
                    values.push(value);
                  }
                }
              }

              resultsCache.cache(
                {
                  pauseId: result.pauseId,
                  point: result.point.point,
                  time: result.point.time,
                  values,
                },
                result.point.point,
                ...params
              );
            }
          }
        );
      }

      return points.map(point => transformPoint(point, ...params));
    },
  });

  return {
    pointsIntervalCache,
    resultsCache,
  };
}

let onPointsReceived: ((points: TimeStampedPoint[]) => void) | undefined;
export function setPointsReceivedCallback(callback: typeof onPointsReceived): void {
  onPointsReceived = callback;
}
