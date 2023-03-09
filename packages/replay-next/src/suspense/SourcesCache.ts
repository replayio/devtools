import { SourceId, TimeStampedPointRange } from "@replayio/protocol";
import {
  PointRange,
  ContentType as ProtocolContentType,
  SameLineSourceLocations as ProtocolSameLineSourceLocations,
  newSource as ProtocolSource,
  SourceId as ProtocolSourceId,
} from "@replayio/protocol";
import { Deferred, createDeferred } from "suspense";

import {
  LineNumberToHitCountMap,
  ReplayClientInterface,
  SourceLocationRange,
} from "shared/client/types";
import { ProtocolError, isCommandError } from "shared/utils/error";
import { isPointRange, toPointRange } from "shared/utils/time";

import { createFetchAsyncFromFetchSuspense } from "../utils/suspense";
import { createGenericCache, createUseGetValue } from "./createGenericCache";
import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED } from "./types";

export type ProtocolSourceContents = {
  contents: string;
  contentType: ProtocolContentType;
};

export type IndexedSource = ProtocolSource & {
  contentHashIndex: number;
  doesContentHashChange: boolean;
};

export type StreamSubscriber = () => void;
export type UnsubscribeFromStream = () => void;

export type StreamingSourceContents = {
  codeUnitCount: number | null;
  complete: boolean;
  contents: string | null;
  contentType: ProtocolContentType | null;
  lineCount: number | null;
  resolver: Promise<StreamingSourceContents>;
  sourceId: ProtocolSourceId;
  subscribe(subscriber: StreamSubscriber): UnsubscribeFromStream;
};

let inProgressSourcesDeferred: Deferred<ProtocolSource[]> | null = null;
let sources: ProtocolSource[] | null = null;
let sourcesByUrl: Map<string, ProtocolSource[]> | null = null;

type MinMaxHitCountTuple = [minHitCount: number, maxHitCount: number];

type SourceIdAndFocusRange = string;

// Source id, location range, and focus range to Record of hit counts;
// this value is what drives Suspense.
const hitCountRecordsMap: Map<string, Record<LineNumberToHitCountMap>> = new Map();
// Source id and focus range to map of cached hit counts by line;
// this map enables us to avoid re-requesting the same lines.
const cachedHitCountsMap: Map<string, LineNumberToHitCountMap> = new Map();
// Source id and focus range to the a tuple of min and max hit counts;
// this value is updated as we fetch new hit counts for the source (and focus range)
const minMaxHitCountsMap: Map<SourceIdAndFocusRange, MinMaxHitCountTuple> = new Map();

const sourceIdToStreamingSourceContentsMap: Map<
  ProtocolSourceId,
  Record<StreamingSourceContents>
> = new Map();

export function preCacheSources(value: ProtocolSource[]): void {
  sources = toIndexedSources(value);
  sourcesByUrl = groupSourcesByUrl(value);
}

export function getSourcesSuspense(client: ReplayClientInterface) {
  if (sources !== null) {
    return sources;
  }

  if (inProgressSourcesDeferred === null) {
    inProgressSourcesDeferred = createDeferred("getSourcesSuspense");

    // Suspense caches fire and forget; errors will be handled within the fetch function.
    fetchSources(client);
  }

  throw inProgressSourcesDeferred.promise;
}

export function getSourcesByUrlSuspense(client: ReplayClientInterface) {
  if (sourcesByUrl !== null) {
    return sourcesByUrl;
  }

  if (inProgressSourcesDeferred === null) {
    inProgressSourcesDeferred = createDeferred("getSourcesSuspense");

    // Suspense caches fire and forget; errors will be handled within the fetch function.
    fetchSources(client);
  }

  throw inProgressSourcesDeferred.promise.then(() => sourcesByUrl);
}

// Wrapper method around getSources Suspense method.
// This method can be used by non-React code to prefetch/prime the Suspense cache by loading object properties.
export const getSourcesAsync = createFetchAsyncFromFetchSuspense(getSourcesSuspense);

export async function getSourceAsync(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId
): Promise<ProtocolSource | null> {
  await getSourcesAsync(client);
  return getSource(client, sourceId);
}

export function getSource(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId
): ProtocolSource | null {
  const sources = getSourcesSuspense(client);
  return sources.find(source => source.sourceId === sourceId) || null;
}

export function getSourceIfAlreadyLoaded(sourceId: ProtocolSourceId): ProtocolSource | null {
  if (sources !== null) {
    return sources.find(source => source.sourceId === sourceId) || null;
  }

  return null;
}

export function getCachedSourceContents(
  sourceId: ProtocolSourceId
): StreamingSourceContents | null {
  const record = sourceIdToStreamingSourceContentsMap.get(sourceId);
  return record?.status === STATUS_RESOLVED ? record.value : null;
}

export const getStreamingSourceContentsAsync = createFetchAsyncFromFetchSuspense(
  getStreamingSourceContentsSuspense
);

export function getStreamingSourceContentsSuspense(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId
): StreamingSourceContents {
  let record = sourceIdToStreamingSourceContentsMap.get(sourceId);
  if (record == null) {
    record = {
      status: STATUS_PENDING,
      value: createDeferred<StreamingSourceContents>(
        `getStreamingSourceContentsSuspense sourceId: ${sourceId}`
      ),
    };

    sourceIdToStreamingSourceContentsMap.set(sourceId, record);

    // Suspense caches fire and forget; errors will be handled within the fetch function.
    fetchStreamingSourceContents(client, sourceId, record, record.value);
  }

  if (record!.status === STATUS_RESOLVED) {
    return record!.value;
  } else if (record!.status === STATUS_PENDING) {
    throw record!.value.promise;
  } else {
    throw record!.value;
  }
}

// Wrapper method around getSourceContents Suspense method.
// This method can be used by non-React code to prefetch/prime the Suspense cache by loading object properties.
export async function getStreamingSourceContentsHelper(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId
): Promise<StreamingSourceContents> {
  try {
    return getStreamingSourceContentsSuspense(client, sourceId);
  } catch (errorOrPromise) {
    await errorOrPromise;
    return getStreamingSourceContentsSuspense(client, sourceId);
  }
}

export function getCachedMinMaxSourceHitCounts(
  sourceId: ProtocolSourceId,
  focusRange: TimeStampedPointRange | PointRange | null
): MinMaxHitCountTuple | [null, null] {
  const key = sourceIdAndFocusRangeToKey(sourceId, focusRange);
  return minMaxHitCountsMap.get(key) || [null, null];
}

export function getSourceHitCountsCacheKey(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId,
  locationRange: SourceLocationRange,
  focusRange: TimeStampedPointRange | PointRange | null
) {
  // Focus range is tracked as TimeStampedPointRange.
  // For convenience, this public API accepts either type.
  let pointRange: PointRange | null = focusRangeToPointRange(focusRange);

  let key = `${sourceId}:${locationRange.start.line}:${locationRange.start.column}:${locationRange.end.line}:${locationRange.end.column}`;
  if (pointRange !== null) {
    key = `${key}:${pointRange.begin}:${pointRange.end}`;
  }
  return key;
}

function focusRangeToPointRange(focusRange: TimeStampedPointRange | PointRange | null) {
  let pointRange: PointRange | null = null;
  if (focusRange !== null) {
    if (isPointRange(focusRange)) {
      pointRange = focusRange;
    } else {
      pointRange = {
        begin: focusRange.begin.point,
        end: focusRange.end.point,
      };
    }
  }
  return pointRange;
}

export function getSourceHitCountsSuspense(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId,
  locationRange: SourceLocationRange,
  focusRange: TimeStampedPointRange | PointRange | null
): LineNumberToHitCountMap {
  const key = getSourceHitCountsCacheKey(client, sourceId, locationRange, focusRange);

  const pointRange = focusRangeToPointRange(focusRange);

  let record = hitCountRecordsMap.get(key);
  if (record == null) {
    record = {
      status: STATUS_PENDING,
      value: createDeferred<LineNumberToHitCountMap>(`getSourceHitCountsSuspense ${key}`),
    };

    hitCountRecordsMap.set(key, record);

    // Suspense caches fire and forget; errors will be handled within the fetch function.
    fetchSourceHitCounts(client, sourceId, locationRange, pointRange, record, record.value);
  }

  if (record!.status === STATUS_RESOLVED) {
    return record!.value;
  } else if (record!.status === STATUS_PENDING) {
    throw record!.value.promise;
  } else {
    throw record!.value;
  }
}

export const getSourceHitCountsAsync = createFetchAsyncFromFetchSuspense(
  getSourceHitCountsSuspense
);

export function getSourceHitCountsIfCached(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId,
  locationRange: SourceLocationRange,
  focusRange: TimeStampedPointRange | PointRange | null
) {
  const cacheKey = getSourceHitCountsCacheKey(client, sourceId, locationRange, focusRange);
  const record = hitCountRecordsMap.get(cacheKey);
  switch (record?.status) {
    case STATUS_RESOLVED: {
      return { value: record.value };
    }
    case STATUS_REJECTED: {
      throw record.value;
    }
  }
}

export const useGetSourceHitCounts = createUseGetValue(
  getSourceHitCountsAsync,
  getSourceHitCountsIfCached,
  getSourceHitCountsCacheKey
);

export type BreakpointPositionsResult = [
  breakablePositions: ProtocolSameLineSourceLocations[],
  breakablePositionsByLine: Map<number, ProtocolSameLineSourceLocations>
];

export const {
  getValueSuspense: getBreakpointPositionsSuspense,
  getValueAsync: getBreakpointPositionsAsync,
  getValueIfCached: getBreakpointPositionsIfCached,
  getCacheKey: getBreakpointPositionsCacheKey,
} = createGenericCache<
  [replayClient: ReplayClientInterface],
  [sourceId: ProtocolSourceId],
  BreakpointPositionsResult
>(
  "SourcesCache: getBreakpointPositions",
  async (sourceId, client) => {
    const breakablePositions = await client.getBreakpointPositions(sourceId, null);

    const breakablePositionsByLine = new Map<number, ProtocolSameLineSourceLocations>();
    // The positions are already sorted by line number in `ReplayClient.getBreakpointPositions`
    for (let position of breakablePositions) {
      // TODO BAC-2329
      // The backend sometimes returns duplicate columns per line;
      // In order to prevent the frontend from showing something weird, let's dedupe them here.
      const uniqueSortedColumns = Array.from(new Set(position.columns));
      uniqueSortedColumns.sort((a, b) => a - b);
      position.columns = uniqueSortedColumns;

      // Maps iterate items in insertion order - this is useful later
      breakablePositionsByLine.set(position.line, position);
    }
    return [breakablePositions, breakablePositionsByLine];
  },
  sourceId => sourceId
);

export const useGetBreakablePositions = createUseGetValue(
  getBreakpointPositionsAsync,
  (sourceId, replayClient) => getBreakpointPositionsIfCached(sourceId),
  (sourceId, replayClient) => getBreakpointPositionsCacheKey(sourceId)
);

async function fetchSources(client: ReplayClientInterface) {
  const protocolSources = await client.findSources();
  sources = toIndexedSources(protocolSources);
  sourcesByUrl = groupSourcesByUrl(protocolSources);

  inProgressSourcesDeferred!.resolve(sources!);
  inProgressSourcesDeferred = null;
}

async function fetchStreamingSourceContents(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId,
  record: Record<StreamingSourceContents>,
  deferred: Deferred<StreamingSourceContents>
) {
  try {
    let notifyResolver: (streamingSourceContents: StreamingSourceContents) => void;
    const resolver = new Promise<StreamingSourceContents>(resolve => {
      notifyResolver = resolve;
    });

    const subscribers: Set<StreamSubscriber> = new Set();
    const streamingSourceContents: StreamingSourceContents = {
      codeUnitCount: null,
      complete: false,
      contents: null,
      contentType: null,
      lineCount: null,
      resolver,
      sourceId,
      subscribe(subscriber: StreamSubscriber) {
        subscribers.add(subscriber);
        return () => {
          subscribers.delete(subscriber);
        };
      },
    };

    const notifySubscribers = () => {
      subscribers.forEach(subscriber => subscriber());
    };

    // Fire and forget; data streams in.
    client
      .streamSourceContents(
        sourceId,
        ({ codeUnitCount, contentType, lineCount }) => {
          streamingSourceContents.codeUnitCount = codeUnitCount;
          streamingSourceContents.contentType = contentType;
          streamingSourceContents.lineCount = lineCount;
          notifySubscribers();
        },
        ({ chunk }) => {
          if (streamingSourceContents.contents === null) {
            streamingSourceContents.contents = chunk;
          } else {
            streamingSourceContents.contents += chunk;
          }

          const isComplete =
            streamingSourceContents.contents.length === streamingSourceContents.codeUnitCount;
          if (isComplete) {
            streamingSourceContents.complete = true;
          }

          notifySubscribers();
        }
      )
      .then(() => {
        subscribers.clear();

        notifyResolver(streamingSourceContents);
      });

    record.status = STATUS_RESOLVED;
    record.value = streamingSourceContents;

    deferred.resolve(record.value);
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    deferred.reject(error);
  }
}

async function fetchSourceHitCounts(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId,
  locationRange: SourceLocationRange,
  focusRange: PointRange | null,
  record: Record<LineNumberToHitCountMap>,
  deferred: Deferred<LineNumberToHitCountMap>
) {
  try {
    const [locations] = await getBreakpointPositionsAsync(sourceId, client);

    // This Suspense cache works a little different from others,
    // because the "key" includes a range of lines and we may have fetched some of them already.
    // The first thing we should do then is decide if we need to fetch anything new,
    // and then return a Map that contains the merged results.
    //
    // Note that we could also treat focus range in the same way (and refine in memory)
    // but give that hit counts can overflow in some recordings (requiring the focus range to be shrunk)
    // it's probably okay to just re-request when the focus range changes.

    let protocolRequests: LineNumberToHitCountMap[] = [];

    const key = sourceIdAndFocusRangeToKey(sourceId, focusRange);

    let map = cachedHitCountsMap.get(key);
    // TODO [hbenl] fix this cache instead of disabling it in tests
    const isTest = window?.location.pathname.startsWith("/tests/");
    if (isTest || map == null) {
      map = new Map(map);

      cachedHitCountsMap.set(key, map);

      // This is the first time we've fetched lines for this source+focus range.
      // The fastest thing is to fetch all of them.
      const hitCounts = await client.getSourceHitCounts(
        sourceId,
        locationRange,
        locations,
        focusRange
      );

      protocolRequests.push(hitCounts);
    } else {
      // We may have fetched some of these lines already.
      // If so, we can skip fetching the ones we already have.

      let startLineNumber = null;
      let endLineNumber = null;
      let promises: Promise<void>[] = [];

      for (
        let lineNumber = locationRange.start.line;
        lineNumber <= locationRange.end.line;
        lineNumber++
      ) {
        // If this is the last line, check if we should fetch a final chunk.
        let shouldFetch = lineNumber === locationRange.end.line && startLineNumber !== null;

        if (map.has(lineNumber)) {
          // If we've reached the end of a range of unloaded lines, we should fetch them.
          shouldFetch = startLineNumber != null;
        } else {
          if (startLineNumber === null) {
            startLineNumber = lineNumber;
          }
          endLineNumber = lineNumber;
        }

        if (shouldFetch) {
          const locationRange = {
            start: {
              line: startLineNumber!,
              column: 0,
            },
            end: {
              line: endLineNumber!,
              column: Number.MAX_SAFE_INTEGER,
            },
          };

          promises.push(
            client
              .getSourceHitCounts(sourceId, locationRange, locations, focusRange)
              .then(hitCounts => {
                protocolRequests.push(hitCounts);
              })
          );

          startLineNumber = null;
          endLineNumber = null;
        }
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }
    }

    protocolRequests.forEach(hitCounts => {
      hitCounts.forEach((hitCount, lineNumber) => {
        map!.set(lineNumber, hitCount);
      });

      // Refine cached min-max hit count as we load more information about a source.
      // Because hit counts may be filtered by a range of lines, this value may change as new information is loaded in.
      let [minHitCount, maxHitCount] = minMaxHitCountsMap.get(key) || [Number.MAX_SAFE_INTEGER, 0];
      hitCounts.forEach(hitCount => {
        const { count } = hitCount;
        minHitCount = Math.min(minHitCount, count);
        maxHitCount = Math.max(maxHitCount, count);
      });
      minMaxHitCountsMap.set(key, [minHitCount, maxHitCount]);
    });

    // At this point, we've fetched all of the data we need.
    const mergedHitCounts: LineNumberToHitCountMap = new Map();
    for (
      let lineNumber = locationRange.start.line;
      lineNumber <= locationRange.end.line;
      lineNumber++
    ) {
      mergedHitCounts.set(lineNumber, map.get(lineNumber)!);
    }

    record.status = STATUS_RESOLVED;
    record.value = mergedHitCounts;

    deferred.resolve(record.value);
  } catch (error) {
    if (
      isCommandError(error, ProtocolError.TooManyLocationsToPerformAnalysis) ||
      isCommandError(error, ProtocolError.LinkerDoesNotSupportAction)
    ) {
      record.status = STATUS_RESOLVED;
      record.value = new Map();
    } else {
      record.status = STATUS_REJECTED;
      record.value = error;

      deferred.reject(error);
    }
  }
}

export function isIndexedSource(source: ProtocolSource): source is IndexedSource {
  return source.hasOwnProperty("contentHashIndex");
}

export function getSourcesToDisplay(client: ReplayClientInterface): ProtocolSource[] {
  const sources = getSourcesSuspense(client);
  return sources.filter(source => source.kind !== "inlineScript");
}

function toIndexedSources(protocolSources: ProtocolSource[]): IndexedSource[] {
  const urlToFirstSource: Map<SourceId, ProtocolSource> = new Map();
  const urlsThatChange: Set<SourceId> = new Set();

  protocolSources.forEach(source => {
    const { contentHash, kind, url } = source;

    if (url) {
      if (urlToFirstSource.has(url)) {
        const firstSource = urlToFirstSource.get(url)!;
        const { contentHash: prevContentHash, kind: prevKind } = firstSource;
        if (kind === prevKind && contentHash !== prevContentHash) {
          urlsThatChange.add(url);
        }
      } else {
        urlToFirstSource.set(url, source);
      }
    }
  });

  const urlToIndex: Map<string, number> = new Map();

  return protocolSources.map(source => {
    const { url } = source;

    let contentHashIndex = 0;
    let doesContentHashChange = false;
    if (url) {
      doesContentHashChange = urlsThatChange.has(url);

      const index = urlToIndex.get(url) || 0;
      contentHashIndex = index;
      urlToIndex.set(url, index + 1);
    }

    return {
      ...source,
      contentHashIndex,
      doesContentHashChange,
    };
  });
}

function groupSourcesByUrl(sources: ProtocolSource[]): Map<string, ProtocolSource[]> {
  const sourcesByUrl = new Map<string, ProtocolSource[]>();

  for (let source of sources) {
    if (!source.url) {
      continue;
    }

    if (!sourcesByUrl.has(source.url)) {
      sourcesByUrl.set(source.url, []);
    }
    sourcesByUrl.get(source.url)!.push(source);
  }

  return sourcesByUrl;
}

function sourceIdAndFocusRangeToKey(
  sourceId: ProtocolSourceId,
  focusRange: TimeStampedPointRange | PointRange | null
) {
  let key = `${sourceId}`;
  if (focusRange !== null) {
    const pointRange = toPointRange(focusRange);
    key = `${key}:${pointRange.begin}:${pointRange.end}`;
  }
  return key;
}

export const {
  getValueAsync: getSourceContentsAsync,
  getValueSuspense: getSourceContentsSuspense,
  getValueIfCached: getSourceContentsIfCached,
  getStatus: getSourceContentsStatus,
} = createGenericCache<
  [replayClient: ReplayClientInterface],
  [sourceId: string],
  StreamingSourceContents | undefined
>(
  "sourceContentsCache",
  async (sourceId, replayClient) => {
    const res = await getStreamingSourceContentsHelper(replayClient, sourceId);
    if (res) {
      // Ensure that follow-on caches have the entire text available
      const sourceContents = await res.resolver;
      return sourceContents;
    }
  },
  sourceId => sourceId
);
