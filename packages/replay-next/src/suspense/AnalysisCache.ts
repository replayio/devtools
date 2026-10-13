import { ExecutionPoint, PauseId, PointDescription, TimeStampedPoint } from "@replayio/protocol";
import { PointSelector, Value } from "@replayio/protocol";
import { ExternallyManagedCache, IntervalCache, createExternallyManagedCache } from "suspense";

import { MAX_POINTS_TO_RUN_EVALUATION } from "shared/client/ReplayClient";
import { ReplayClientInterface } from "shared/client/types";
import { ProtocolError, commandError, isCommandError } from "shared/utils/error";

import { createFocusIntervalCacheForExecutionPoints } from "./FocusIntervalCache";
import { objectCache, objectPropertyCache } from "./ObjectPreviews";
import { cachePauseData, setPointAndTimeForPauseId } from "./PauseCache";
import { sourcesByIdCache } from "./SourcesCache";

export interface AnalysisParams {
  selector: PointSelector;
  expression: string;
  frameIndex?: number;
}

export interface RemoteAnalysisResult {
  failed: boolean;
  pauseId: PauseId;
  point: ExecutionPoint;
  time: number;
  values: Value[];
}

export interface AnalysisCache<T extends { point: ExecutionPoint }, TParams extends any[]> {
  pointsIntervalCache: IntervalCache<
    bigint,
    [client: ReplayClientInterface, ...params: TParams],
    T
  >;
  resultsCache: ExternallyManagedCache<
    [executionPoint: ExecutionPoint, ...params: TParams],
    RemoteAnalysisResult
  >;
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
  ) => PointDescription[] | PromiseLike<PointDescription[]>,
  createEvaluationParams: (
    client: ReplayClientInterface,
    points: PointDescription[],
    ...params: TParams
  ) => AnalysisParams | Promise<AnalysisParams>,
  transformPoint: (point: PointDescription, ...params: TParams) => TPoint
): AnalysisCache<TPoint, TParams> {
  const resultsCache: ExternallyManagedCache<
    [executionPoint: ExecutionPoint, ...params: TParams],
    RemoteAnalysisResult
  > = createExternallyManagedCache({
    debugLabel: `${debugLabel} Cache`,
    getKey: ([executionPoint, ...params]) => {
      const baseKey = getKey(...params);
      return `${baseKey}:${executionPoint}`;
    },
  });

  const pointsIntervalCache = createFocusIntervalCacheForExecutionPoints<
    [client: ReplayClientInterface, ...params: TParams],
    TPoint
  >({
    debugLabel: `${debugLabel} IntervalCache`,
    getKey: (client, ...params) => getKey(...params),
    getPointForValue: pointDescription => pointDescription.point,
    load: async (begin, end, client, ...paramsWithCacheLoadOptions) => {
      const params = paramsWithCacheLoadOptions.slice(0, -1) as TParams;
      const points = await findPoints(client, begin, end, ...params);

      if (points.length === 0) {
        return [];
      }
      if (points.length > MAX_POINTS_TO_RUN_EVALUATION) {
        throw commandError("Too many points to run evaluation", ProtocolError.TooManyPoints);
      }

      const evaluationParams = await createEvaluationParams(client, points, ...params);
      const sources = await sourcesByIdCache.readAsync(client);

      client
        .runEvaluation(
          {
            selector: evaluationParams.selector,
            expression: evaluationParams.expression,
            frameIndex: evaluationParams.frameIndex,
            fullPropertyPreview: true,
            limits: { begin, end },
          },
          async results => {
            for (const result of results) {
              setPointAndTimeForPauseId(result.pauseId, result.point);
              cachePauseData(client, sources, result.pauseId, result.data);

              let values: Value[] = [];
              if (result.exception) {
                values.push(result.exception);
              } else if (result.returned?.object) {
                const objectPreview = await objectCache.readAsync(
                  client,
                  result.pauseId,
                  result.returned.object,
                  "canOverflow"
                );
                if (objectPreview?.className === "Object") {
                  values.push(result.returned);
                } else {
                  // assume this is an array
                  const length =
                    (
                      await objectPropertyCache.readAsync(
                        client,
                        result.pauseId,
                        result.returned.object,
                        "length"
                      )
                    )?.value ?? 0;
                  const promises = [];
                  for (let i = 0; i < length; i++) {
                    promises.push(
                      objectPropertyCache.readAsync(
                        client,
                        result.pauseId,
                        result.returned.object,
                        String(i)
                      )
                    );
                  }
                  values = (await Promise.all(promises)).filter(value => !!value) as Value[];
                }
              }

              resultsCache.cacheValue(
                {
                  failed: result.failed ?? false,
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
        )
        .catch(error => {
          if (isCommandError(error, ProtocolError.FocusWindowChange)) {
            pointsIntervalCache.evict(client, ...params);
          }
          throw error;
        });

      return points.map(point => transformPoint(point, ...params));
    },
  });

  return {
    pointsIntervalCache,
    resultsCache,
  };
}
