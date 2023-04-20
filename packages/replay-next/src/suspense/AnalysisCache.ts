import { ExecutionPoint, PauseId, PointDescription, TimeStampedPoint } from "@replayio/protocol";
import { PointSelector, Value } from "@replayio/protocol";
import {
  Cache,
  ExternallyManagedCache,
  IntervalCache,
  createExternallyManagedCache,
} from "suspense";

import { compareNumericStrings } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";
import { ProtocolError, isCommandError } from "shared/utils/error";

import { createFocusIntervalCache } from "./FocusIntervalCache";
import { objectPropertyCache } from "./ObjectPreviews";
import { cachePauseData, setPointAndTimeForPauseId } from "./PauseCache";

export interface AnalysisParams {
  selector: PointSelector;
  expression: string;
  frameIndex?: number;
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

  const pointsIntervalCache = createFocusIntervalCache<
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

      const evaluationParams = await createEvaluationParams(client, points, ...params);

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
              cachePauseData(client, result.pauseId, result.data);

              let values: Value[] = [];
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

              resultsCache.cacheValue(
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

let onPointsReceived: ((points: TimeStampedPoint[]) => void) | undefined;
export function setPointsReceivedCallback(callback: typeof onPointsReceived): void {
  onPointsReceived = callback;
}
