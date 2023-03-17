import {
  ExecutionPoint,
  Frame,
  Location,
  PauseId,
  PointDescription,
  Object as ProtocolObject,
  Scope,
} from "@replayio/protocol";
import {
  IntervalCache,
  PendingRecord,
  Record,
  assertPendingRecord,
  createIntervalCache,
  createPendingRecord,
  createResolvedRecord,
  isPendingRecord,
  isRejectedRecord,
  isResolvedRecord,
  updateRecordToResolved,
} from "suspense";

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
  pointsCache: IntervalCache<
    ExecutionPoint,
    [client: ReplayClientInterface, ...params: TParams],
    T
  >;
  getResultSuspense(point: ExecutionPoint, ...params: TParams): RemoteAnalysisResult;
  getResultAsync(
    point: ExecutionPoint,
    ...params: TParams
  ): PromiseLike<RemoteAnalysisResult> | RemoteAnalysisResult;
  getResultIfCached(point: ExecutionPoint, ...params: TParams): RemoteAnalysisResult | undefined;
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

const analysisResultsCaches = new Map<string, Map<ExecutionPoint, Record<RemoteAnalysisResult>>>();
function getAnalysisResultsCache(params: AnalysisParams) {
  const key = getCacheKey(params);
  if (!analysisResultsCaches.has(key)) {
    analysisResultsCaches.set(key, new Map<ExecutionPoint, Record<RemoteAnalysisResult>>());
  }
  return analysisResultsCaches.get(key)!;
}

export function createAnalysisCache<
  TPoint extends { point: ExecutionPoint },
  TParams extends any[]
>(
  debugLabel: string,
  createAnalysisParams: (...params: TParams) => AnalysisParams,
  transformPoint: (point: PointDescription, ...params: TParams) => TPoint
): AnalysisCache<TPoint, TParams> {
  const pointsCache = createIntervalCache<
    ExecutionPoint,
    [client: ReplayClientInterface, ...params: TParams],
    TPoint
  >({
    debugLabel,
    getKey: (client, ...params) => getCacheKey(createAnalysisParams(...params)),
    getPointForValue: pointDescription => pointDescription.point,
    comparePoints: compareNumericStrings,
    load: async (begin, end, client, ...paramsWithCacheLoadOptions) => {
      const params = paramsWithCacheLoadOptions.slice(0, -1) as TParams;
      const analysisParams = createAnalysisParams(...params);
      const results = getAnalysisResultsCache(analysisParams);
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
              const record = results.get(result.point);
              if (record) {
                assertPendingRecord(record);

                const { deferred } = (record as PendingRecord<RemoteAnalysisResult>).data;

                updateRecordToResolved(record, result);

                deferred.resolve(result);
              } else {
                results.set(result.point, createResolvedRecord<RemoteAnalysisResult>(result));
              }
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

  function getOrCreateRecord(params: AnalysisParams, point: ExecutionPoint) {
    const results = getAnalysisResultsCache(params);
    let record = results.get(point);
    if (!record) {
      record = createPendingRecord<RemoteAnalysisResult>();

      results.set(point, record);
    }
    return record;
  }

  function getResultSuspense(point: ExecutionPoint, ...params: TParams) {
    const record = getOrCreateRecord(createAnalysisParams(...params), point);
    if (isPendingRecord(record)) {
      throw record.data.deferred.promise;
    } else if (isRejectedRecord(record)) {
      throw record.data.error;
    }

    return record.data.value as RemoteAnalysisResult;
  }

  function getResultAsync(point: ExecutionPoint, ...params: TParams) {
    const record = getOrCreateRecord(createAnalysisParams(...params), point);
    if (isPendingRecord(record)) {
      return record.data.deferred.promise;
    } else if (isRejectedRecord(record)) {
      throw record.data.error;
    }

    return record.data.value as RemoteAnalysisResult;
  }

  function getResultIfCached(point: ExecutionPoint, ...params: TParams) {
    const results = getAnalysisResultsCache(createAnalysisParams(...params));
    const record = results.get(point);
    if (record && isResolvedRecord(record)) {
      return record.data.value;
    }
  }

  return {
    pointsCache,
    getResultSuspense,
    getResultAsync,
    getResultIfCached,
  };
}
