import { SourceId, TimeStampedPointRange } from "@replayio/protocol";
import {
  PointRange,
  ContentType as ProtocolContentType,
  newSource as ProtocolSource,
  SourceId as ProtocolSourceId,
} from "@replayio/protocol";
import { Cache, createCache, createSingleEntryCache } from "suspense";

import {
  LineNumberToHitCountMap,
  ReplayClientInterface,
  SourceLocationRange,
} from "shared/client/types";
import { ProtocolError, isCommandError } from "shared/utils/error";
import { isPointRange, toPointRange } from "shared/utils/time";

import { breakpointPositionsCache } from "./BreakpointPositionsCache";

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

type MinMaxHitCountTuple = [minHitCount: number, maxHitCount: number];

type SourceIdAndFocusRange = string;

// Source id and focus range to the a tuple of min and max hit counts;
// this value is updated as we fetch new hit counts for the source (and focus range)
const minMaxHitCountsMap: Map<SourceIdAndFocusRange, MinMaxHitCountTuple> = new Map();

export const sourcesCache: Cache<[client: ReplayClientInterface], ProtocolSource[]> =
  createSingleEntryCache({
    debugLabel: "Sources",
    load: async ([client]) => {
      const protocolSources = await client.findSources();

      const urlToFirstSource: Map<SourceId, ProtocolSource> = new Map();
      const urlsThatChange: Set<SourceId> = new Set();

      protocolSources.forEach(source => {
        const { contentHash, kind, sourceId, url } = source;

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
    },
  });

export const sourcesByUrlCache: Cache<
  [client: ReplayClientInterface],
  Map<string, ProtocolSource[]>
> = createSingleEntryCache({
  debugLabel: "SourcesByUrl",
  load: async ([client]) => {
    const sources = await sourcesCache.readAsync(client);

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
  },
});

export const sourceHitCountsCache: Cache<
  [
    client: ReplayClientInterface,
    sourceId: ProtocolSourceId,
    locationRange: SourceLocationRange,
    focusRange: TimeStampedPointRange | PointRange | null
  ],
  LineNumberToHitCountMap
> = createCache({
  debugLabel: "SourceHitCounts",
  getKey: ([client, sourceId, locationRange, focusRange]) => {
    // Focus range is tracked as TimeStampedPointRange.
    // For convenience, this public API accepts either type.
    let pointRange: PointRange | null = focusRangeToPointRange(focusRange);

    let key = `${sourceId}:${locationRange.start.line}:${locationRange.start.column}:${locationRange.end.line}:${locationRange.end.column}`;
    if (pointRange !== null) {
      key = `${key}:${pointRange.begin}:${pointRange.end}`;
    }
    return key;
  },
  load: async ([client, sourceId, locationRange, focusRange]) => {
    focusRange = focusRangeToPointRange(focusRange);

    // Source id and focus range to map of cached hit counts by line;
    // this map enables us to avoid re-requesting the same lines.
    const cachedHitCountsMap: Map<string, LineNumberToHitCountMap> = new Map();

    try {
      const [locations] = await breakpointPositionsCache.readAsync(client, sourceId);

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
        const map = new Map();

        return map;
      } else {
        throw error;
      }
    }
  },
});

export const streamingSourceContentsCache: Cache<
  [client: ReplayClientInterface, sourceId: SourceId],
  StreamingSourceContents
> = createCache({
  debugLabel: "StreamingSourceContents",
  getKey: ([client, sourceId]) => sourceId,
  load: ([client, sourceId]) => {
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

      return streamingSourceContents;
    } catch (error) {
      throw error;
    }
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

export async function getSourceAsync(
  client: ReplayClientInterface,
  sourceId: SourceId
): Promise<ProtocolSource | null> {
  const sources = await sourcesCache.readAsync(client);
  return sources.find(source => source.sourceId === sourceId) ?? null;
}

export function getSourceIfCached(sourceId: SourceId): ProtocolSource | null {
  const sources = sourcesCache.getValueIfCached(null as any);
  if (sources) {
    return sources.find(source => source.sourceId === sourceId) ?? null;
  }
  return null;
}

export function getSourceSuspends(
  client: ReplayClientInterface,
  sourceId: SourceId
): ProtocolSource | null {
  const sources = sourcesCache.read(client);
  return sources.find(source => source.sourceId === sourceId) ?? null;
}

export function isIndexedSource(source: ProtocolSource): source is IndexedSource {
  return source.hasOwnProperty("contentHashIndex");
}

export function shouldSourceBeDisplayed(source: ProtocolSource): boolean {
  return source.kind !== "inlineScript";
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
