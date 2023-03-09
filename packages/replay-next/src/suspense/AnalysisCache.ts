import {
  ExecutionPoint,
  Frame,
  Location,
  PauseId,
  PointDescription,
  PointRange,
  Object as ProtocolObject,
  Scope,
} from "@replayio/protocol";
import {
  PendingRecord,
  Record,
  createPendingRecord,
  createResolvedRecord,
  isPendingRecord,
  isRejectedRecord,
  isResolvedRecord,
  updateRecordToResolved,
} from "suspense";

import { MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/analysisManager";
import { ReplayClientInterface } from "shared/client/types";

import { createGenericRangeCache } from "./createGenericRangeCache";
import { cachePauseData } from "./PauseCache";
import { getBreakpointPositionsAsync } from "./SourcesCache";

export type RemoteAnalysisResult = {
  data: { frames: Frame[]; objects: ProtocolObject[]; scopes: Scope[] };
  location: Location | Location[];
  pauseId: PauseId;
  point: ExecutionPoint;
  time: number;
  values: Array<{ value?: any; object?: string }>;
};

export interface AnalysisCache<T extends { point: ExecutionPoint }> {
  getPointsSuspense(client: ReplayClientInterface, range: PointRange): T[];
  getPointsAsync(client: ReplayClientInterface, range: PointRange): PromiseLike<T[]> | T[];
  getCachedPoints(range: PointRange): T[];
  getResultSuspense(point: ExecutionPoint): RemoteAnalysisResult;
  getResultAsync(point: ExecutionPoint): PromiseLike<RemoteAnalysisResult> | RemoteAnalysisResult;
  getResultIfCached(point: ExecutionPoint): RemoteAnalysisResult | undefined;
}

const cacheMap = new Map<string, AnalysisCache<any>>();

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

export function getAnalysisCache<T extends { point: ExecutionPoint }>(
  params: AnalysisParams,
  transformPoint: (point: PointDescription) => T
): AnalysisCache<T> {
  const key = getCacheKey(params);
  if (!cacheMap.has(key)) {
    cacheMap.set(key, createCache(params, transformPoint));
  }
  return cacheMap.get(key)!;
}

function createCache<T extends { point: ExecutionPoint }>(
  params: AnalysisParams,
  transformPoint: (point: PointDescription) => T
): AnalysisCache<T> {
  const results = new Map<ExecutionPoint, Record<RemoteAnalysisResult>>();

  const {
    getValuesSuspense: getPointsSuspense,
    getValuesAsync: getPointsAsync,
    getCachedValues: getCachedPoints,
  } = createGenericRangeCache<T>(
    async (client, range, cacheValues, cacheError) => {
      const locations = params.location
        ? client.getCorrespondingLocations(params.location).map(location => ({
            location,
          }))
        : undefined;
      if (locations) {
        await Promise.all(
          locations.map(location => getBreakpointPositionsAsync(location.location.sourceId, client))
        );
      }

      let pointsCount = 0;
      await client.streamAnalysis(
        {
          locations,
          eventHandlerEntryPoints: params.eventTypes?.map(eventType => ({ eventType })),
          exceptionPoints: params.exceptions,
          mapper: params.mapper,
          effectful: false,
          range,
        },
        {
          onPoints: points => {
            pointsCount += points.length;
            cacheValues(points.map(transformPoint));
          },
          onResults: analysisEntries => {
            for (const analysisEntry of analysisEntries) {
              const result = analysisEntry.value;
              cachePauseData(client, result.pauseId, result.data);
              const record = results.get(result.point);
              if (record) {
                (record as PendingRecord<RemoteAnalysisResult>).data.deferred.resolve(result);

                updateRecordToResolved(result, result);
              } else {
                results.set(result.point, createResolvedRecord<RemoteAnalysisResult>(result));
              }
            }
          },
          onError: cacheError,
        }
      ).pointsFinished;

      if (pointsCount > MAX_POINTS_FOR_FULL_ANALYSIS) {
        cacheError(new Error("Too many points to run analysis"));
      }
    },
    pointDescription => pointDescription.point
  );

  function getOrCreateRecord(point: ExecutionPoint) {
    let record = results.get(point);
    if (!record) {
      record = createPendingRecord<RemoteAnalysisResult>();

      results.set(point, record);
    }
    return record;
  }

  function getResultSuspense(point: ExecutionPoint) {
    const record = getOrCreateRecord(point);
    if (isPendingRecord(record)) {
      throw record.data.deferred.promise;
    } else if (isRejectedRecord(record)) {
      throw record.data.error;
    }

    return record.data.value as RemoteAnalysisResult;
  }

  function getResultAsync(point: ExecutionPoint) {
    const record = getOrCreateRecord(point);
    if (isPendingRecord(record)) {
      return record.data.deferred.promise;
    } else if (isRejectedRecord(record)) {
      throw record.data.error;
    }

    return record.data.value as RemoteAnalysisResult;
  }

  function getResultIfCached(point: ExecutionPoint) {
    const record = results.get(point);
    if (record && isResolvedRecord(record)) {
      return record.data.value;
    }
  }

  return {
    getPointsSuspense,
    getPointsAsync,
    getCachedPoints,
    getResultSuspense,
    getResultAsync,
    getResultIfCached,
  };
}
