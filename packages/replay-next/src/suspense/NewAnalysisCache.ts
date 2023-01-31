import { ExecutionPoint, Location, PointDescription, PointRange } from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";

import { createWakeable } from "../utils/suspense";
import { RemoteAnalysisResult, createMapperForAnalysis } from "./AnalysisCache";
import { createGenericRangeCache } from "./createGenericRangeCache";
import { cachePauseData } from "./PauseCache";
import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Thennable } from "./types";

export interface AnalysisCache<T extends { point: ExecutionPoint }> {
  getPointsSuspense(client: ReplayClientInterface, range: PointRange): T[];
  getPointsAsync(client: ReplayClientInterface, range: PointRange): Thennable<T[]> | T[];
  getCachedPoints(range: PointRange): T[];
  getResultSuspense(point: ExecutionPoint): RemoteAnalysisResult;
  getResultAsync(point: ExecutionPoint): Thennable<RemoteAnalysisResult> | RemoteAnalysisResult;
  getResultIfCached(point: ExecutionPoint): RemoteAnalysisResult | undefined;
}

const cachesByLocationAndMapper = new Map<string, AnalysisCache<any>>();

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
  if (!cachesByLocationAndMapper.has(key)) {
    cachesByLocationAndMapper.set(key, createCache(params, transformPoint));
  }
  return cachesByLocationAndMapper.get(key)!;
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
    async (client, range, cacheValues) => {
      await client.streamAnalysis(
        {
          locations: params.location ? [{ location: params.location }] : undefined,
          eventHandlerEntryPoints: params.eventTypes?.map(eventType => ({ eventType })),
          exceptionPoints: params.exceptions,
          mapper: params.mapper,
          effectful: false,
          range,
        },
        points => cacheValues(points.map(transformPoint)),
        analysisEntries => {
          for (const analysisEntry of analysisEntries) {
            const result = analysisEntry.value;
            cachePauseData(client, result.pauseId, result.data);
            const record = results.get(result.point);
            if (record) {
              record.value.resolve(result);
              record.status = STATUS_RESOLVED;
              record.value = result;
            } else {
              results.set(result.point, {
                status: STATUS_RESOLVED,
                value: result,
              });
            }
          }
        }
      ).pointsReceived;
    },
    pointDescription => pointDescription.point
  );

  function getOrCreateRecord(point: ExecutionPoint) {
    let record = results.get(point);
    if (!record) {
      const wakeable = createWakeable<RemoteAnalysisResult>("AnalysisCache.getResultSuspense");
      record = {
        status: STATUS_PENDING,
        value: wakeable,
      };
      results.set(point, record);
    }
    return record;
  }

  function getResultSuspense(point: ExecutionPoint) {
    const record = getOrCreateRecord(point);
    if (record.status === STATUS_RESOLVED) {
      return record.value;
    } else {
      throw record.value;
    }
  }

  function getResultAsync(point: ExecutionPoint) {
    const record = getOrCreateRecord(point);
    if (record.status !== STATUS_REJECTED) {
      return record.value;
    } else {
      throw record.value;
    }
  }

  function getResultIfCached(point: ExecutionPoint) {
    const record = results.get(point);
    if (record?.status === STATUS_RESOLVED) {
      return record.value;
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

export function getAnalysisResultSuspense(
  client: ReplayClientInterface,
  range: PointRange,
  point: ExecutionPoint,
  location: Location,
  content: string,
  condition: string | null
) {
  const cache = getAnalysisCache<PointDescription>(
    {
      mapper: createMapperForAnalysis(content, condition),
      location,
    },
    point => point
  );
  cache.getPointsAsync(client, range);
  return cache.getResultSuspense(point);
}
