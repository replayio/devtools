import {
  ExecutionPoint,
  Frame,
  Location,
  PauseId,
  PointDescription,
  Object as ProtocolObject,
  Scope,
} from "@replayio/protocol";
import { Cache, IntervalCache, createExternallyManagedCache, createIntervalCache } from "suspense";

import { MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/analysisManager";
import { compareNumericStrings } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";

import { breakpointPositionsCache } from "./BreakpointPositionsCache";
import { cachePauseData } from "./PauseCache";

export type RemoteAnalysisResult = {
  data: { frames: Frame[]; objects: ProtocolObject[]; scopes: Scope[] };
  location: Location | Location[];
  pauseId: PauseId;
  point: ExecutionPoint;
  time: number;
  values: Array<{ value?: any; object?: string }>;
};

export interface AnalysisCache<T extends { point: ExecutionPoint }, TParams extends any[]> {
  pointsIntervalCache: IntervalCache<
    ExecutionPoint,
    [client: ReplayClientInterface, ...params: TParams],
    T
  >;
  resultsCache: Cache<[executionPoint: ExecutionPoint, ...params: TParams], RemoteAnalysisResult>;
}

export interface AnalysisParams {
  location?: Location;
  eventTypes?: string[];
  exceptions?: true;
  mapper: string;
}

function getCacheKey(params: AnalysisParams) {
  let cacheKey = "";
  if (params.location) {
    cacheKey += `${params.location.sourceId}:${params.location.line}:${params.location.column}:`;
  }
  if (params.eventTypes) {
    cacheKey += `${params.eventTypes.join(",")}:`;
  }
  if (params.exceptions) {
    cacheKey += "exceptions:";
  }
  return cacheKey + params.mapper;
}

export function createAnalysisCache<
  TPoint extends { point: ExecutionPoint },
  TParams extends any[]
>(
  debugLabel: string,
  createAnalysisParams: (...params: TParams) => AnalysisParams,
  transformPoint: (point: PointDescription, ...params: TParams) => TPoint
): AnalysisCache<TPoint, TParams> {
  const resultsCache: Cache<
    [executionPoint: ExecutionPoint, ...params: TParams],
    RemoteAnalysisResult
  > = createExternallyManagedCache({
    debugLabel: `${debugLabel} Cache`,
    getKey: ([executionPoint, ...params]) => {
      const analysisParams = createAnalysisParams(...params);
      const baseKey = getCacheKey(analysisParams);
      return `${baseKey}:${executionPoint}`;
    },
  });

  const pointsIntervalCache = createIntervalCache<
    ExecutionPoint,
    [client: ReplayClientInterface, ...params: TParams],
    TPoint
  >({
    debugLabel: `${debugLabel} IntervalCache`,
    getKey: (client, ...params) => getCacheKey(createAnalysisParams(...params)),
    getPointForValue: pointDescription => pointDescription.point,
    comparePoints: compareNumericStrings,
    load: async (begin, end, client, ...paramsWithCacheLoadOptions) => {
      const params = paramsWithCacheLoadOptions.slice(0, -1) as TParams;
      const analysisParams = createAnalysisParams(...params);
      const locations = analysisParams.location
        ? client.getCorrespondingLocations(analysisParams.location).map(location => ({
            location,
          }))
        : undefined;
      if (locations) {
        await Promise.all(
          locations.map(location =>
            breakpointPositionsCache.readAsync(client, location.location.sourceId)
          )
        );
      }

      let allPoints: TPoint[] = [];
      let error: any;
      await client.streamAnalysis(
        {
          locations,
          eventHandlerEntryPoints: analysisParams.eventTypes?.map(eventType => ({ eventType })),
          exceptionPoints: analysisParams.exceptions,
          mapper: analysisParams.mapper,
          effectful: false,
          range: { begin, end },
        },
        {
          onPoints: points => {
            allPoints = allPoints.concat(points.map(point => transformPoint(point, ...params)));
          },
          onResults: analysisEntries => {
            for (const analysisEntry of analysisEntries) {
              const result = analysisEntry.value as RemoteAnalysisResult;
              cachePauseData(client, result.pauseId, result.data);

              resultsCache.cache(result, result.point, ...params);
            }
          },
          onError: err => (error = err),
        }
      ).pointsFinished;

      if (error) {
        throw error;
      }
      if (allPoints.length > MAX_POINTS_FOR_FULL_ANALYSIS) {
        throw new Error("Too many points to run analysis");
      }
      return allPoints;
    },
  });

  return {
    pointsIntervalCache,
    resultsCache,
  };
}
