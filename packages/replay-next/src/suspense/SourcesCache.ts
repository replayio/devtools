import { SourceId, TimeStampedPointRange } from "@replayio/protocol";
import {
  PointRange,
  ContentType as ProtocolContentType,
  SameLineSourceLocations as ProtocolSameLineSourceLocations,
  newSource as ProtocolSource,
  SourceId as ProtocolSourceId,
} from "@replayio/protocol";
import {
  StreamingCacheLoadOptions,
  StreamingValue,
  createCache,
  createSingleEntryCache,
  createStreamingCache,
} from "suspense";

import {
  LineNumberToHitCountMap,
  ReplayClientInterface,
  SourceLocationRange,
} from "shared/client/types";
import { ProtocolError, isCommandError } from "shared/utils/error";
import { isPointRange, toPointRange } from "shared/utils/time";

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

export type StreamingSourceMetadata = {
  codeUnitCount: number;
  contentType: ProtocolContentType;
  lineCount: number;
};

type MinMaxHitCountTuple = [minHitCount: number, maxHitCount: number];

type SourceIdAndFocusRange = string;

// Source id and focus range to map of cached hit counts by line;
// this map enables us to avoid re-requesting the same lines.
const cachedHitCountsMap: Map<string, LineNumberToHitCountMap> = new Map();

// Source id and focus range to the a tuple of min and max hit counts;
// this value is updated as we fetch new hit counts for the source (and focus range)
const minMaxHitCountsMap: Map<SourceIdAndFocusRange, MinMaxHitCountTuple> = new Map();

export const sourcesByUrlCache = createSingleEntryCache<
  [client: ReplayClientInterface],
  Map<string, ProtocolSource[]>
>({
  debugLabel: "SourcesByUrlCache",
  load: async (client: ReplayClientInterface) => {
    const protocolSources = await client.findSources();

    sourcesCache.cache(toIndexedSources(protocolSources), client);

    return groupSourcesByUrl(protocolSources);
  },
});

export const sourcesCache = createSingleEntryCache<
  [client: ReplayClientInterface],
  ProtocolSource[]
>({
  debugLabel: "SourcesCache",
  load: async (client: ReplayClientInterface) => {
    const protocolSources = await client.findSources();

    sourcesByUrlCache.cache(groupSourcesByUrl(protocolSources), client);

    return toIndexedSources(protocolSources);
  },
});

export const sourceCache = createCache<
  [client: ReplayClientInterface, sourceId: ProtocolSourceId],
  ProtocolSource | null
>({
  debugLabel: "SourceCache",
  getKey: (client: ReplayClientInterface, sourceId: ProtocolSourceId) => sourceId,
  load: async (client: ReplayClientInterface, sourceId: ProtocolSourceId) => {
    const sources = await sourcesCache.readAsync(client);
    return sources.find(source => source.sourceId === sourceId) || null;
  },
});

export function getCachedMinMaxSourceHitCounts(
  sourceId: ProtocolSourceId,
  focusRange: TimeStampedPointRange | PointRange | null
): MinMaxHitCountTuple | [null, null] {
  const key = sourceIdAndFocusRangeToKey(sourceId, focusRange);
  return minMaxHitCountsMap.get(key) || [null, null];
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

export const sourceHitCountsCache = createCache<
  [
    client: ReplayClientInterface,
    sourceId: ProtocolSourceId,
    locationRange: SourceLocationRange,
    focusRange: TimeStampedPointRange | PointRange | null
  ],
  LineNumberToHitCountMap
>({
  debugLabel: "sourceHitCountsCache",
  getKey: (
    client: ReplayClientInterface,
    sourceId: ProtocolSourceId,
    locationRange: SourceLocationRange,
    focusRange: TimeStampedPointRange | PointRange | null
  ) => {
    // Focus range is tracked as TimeStampedPointRange.
    // For convenience, this public API accepts either type.
    let pointRange: PointRange | null = focusRangeToPointRange(focusRange);

    let key = `${sourceId}:${locationRange.start.line}:${locationRange.start.column}:${locationRange.end.line}:${locationRange.end.column}`;
    if (pointRange !== null) {
      key = `${key}:${pointRange.begin}:${pointRange.end}`;
    }
    return key;
  },
  load: async (
    client: ReplayClientInterface,
    sourceId: ProtocolSourceId,
    locationRange: SourceLocationRange,
    focusRangeOrPointRange: TimeStampedPointRange | PointRange | null
  ) => {
    const pointRange = focusRangeToPointRange(focusRangeOrPointRange);

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

      const key = sourceIdAndFocusRangeToKey(sourceId, pointRange);

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
          pointRange
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
                .getSourceHitCounts(sourceId, locationRange, locations, pointRange)
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
        let [minHitCount, maxHitCount] = minMaxHitCountsMap.get(key) || [
          Number.MAX_SAFE_INTEGER,
          0,
        ];
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

      return mergedHitCounts;
    } catch (error) {
      if (
        isCommandError(error, ProtocolError.TooManyLocationsToPerformAnalysis) ||
        isCommandError(error, ProtocolError.LinkerDoesNotSupportAction)
      ) {
        return new Map();
      }

      throw error;
    }
  },
});

export type BreakpointPositionsResult = [
  breakablePositions: ProtocolSameLineSourceLocations[],
  breakablePositionsByLine: Map<number, ProtocolSameLineSourceLocations>
];

export const breakablePositionsCache = createCache<
  [sourceId: ProtocolSourceId, replayClient: ReplayClientInterface],
  BreakpointPositionsResult
>({
  debugLabel: "SourcesCache: getBreakpointPositions",
  getKey: (sourceId, client) => sourceId,
  load: async (sourceId, client) => {
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
});

export const {
  getValueIfCached: getBreakpointPositionsIfCached,
  read: getBreakpointPositionsSuspense,
  readAsync: getBreakpointPositionsAsync,
} = breakablePositionsCache;

export function isIndexedSource(source: ProtocolSource): source is IndexedSource {
  return source.hasOwnProperty("contentHashIndex");
}

export function getSourcesToDisplay(client: ReplayClientInterface): ProtocolSource[] {
  const sources = sourcesCache.read(client);
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

export type StreamingSourceContents = StreamingValue<string, StreamingSourceMetadata>;

export const sourceContentsCache = createCache<
  [sourceId: string, replayClient: ReplayClientInterface],
  StreamingSourceContents | undefined
>({
  debugLabel: "sourceContentsCache",
  getKey: sourceId => sourceId,
  load: async (sourceId, replayClient) => {
    const stream = streamingSourceContentsCache.stream(replayClient, sourceId);

    // Ensure that follow-on caches have the entire text available
    const sourceContents = await stream.resolver;

    return sourceContents;
  },
});

export const streamingSourceContentsCache = createStreamingCache<
  [client: ReplayClientInterface, sourceId: ProtocolSourceId],
  string,
  StreamingSourceMetadata
>({
  debugLabel: "streamingSourceContentsCache",
  getKey: (client: ReplayClientInterface, sourceId: ProtocolSourceId) => sourceId,
  load: async (
    options: StreamingCacheLoadOptions<string, StreamingSourceMetadata>,
    client: ReplayClientInterface,
    sourceId: ProtocolSourceId
  ) => {
    const { reject, update, resolve } = options;

    try {
      let content: string = "";
      let metadata: StreamingSourceMetadata | null = null;

      await client.streamSourceContents(
        sourceId,
        ({ codeUnitCount, contentType, lineCount }) => {
          metadata = {
            codeUnitCount: codeUnitCount,
            contentType: contentType,
            lineCount: lineCount,
          };

          update("", 0, metadata);
        },
        ({ chunk }) => {
          content += chunk;

          update(content, content.length / metadata!.codeUnitCount);
        }
      );

      resolve();
    } catch (error) {
      reject(error);
    }
  },
});
