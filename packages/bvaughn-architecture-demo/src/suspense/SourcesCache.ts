import { SourceId, TimeStampedPointRange } from "@replayio/protocol";
import {
  ContentType as ProtocolContentType,
  newSource as ProtocolSource,
  PointRange,
  SameLineSourceLocations as ProtocolSameLineSourceLocations,
  SourceId as ProtocolSourceId,
} from "@replayio/protocol";
import {
  LineNumberToHitCountMap,
  ReplayClientInterface,
  SourceLocationRange,
} from "shared/client/types";

import { createWakeable } from "../utils/suspense";
import { createGenericCache } from "./createGenericCache";

import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";

export type ProtocolSourceContents = {
  contents: string;
  contentType: ProtocolContentType;
};

export type IndexedSource = ProtocolSource & {
  contentHashIndex: number;
  doesContentHashChange: boolean;
};

let inProgressSourcesWakeable: Wakeable<ProtocolSource[]> | null = null;
let sources: ProtocolSource[] | null = null;

type MinMaxHitCountTuple = [minHitCount: number, maxHitCount: number];

const sourceIdToHitCountsMap: Map<string, Record<LineNumberToHitCountMap>> = new Map();
const sourceIdToMinMaxHitCountsMap: Map<string, MinMaxHitCountTuple> = new Map();

const sourceIdToSourceContentsMap: Map<
  ProtocolSourceId,
  Record<ProtocolSourceContents>
> = new Map();

export function preCacheSources(value: ProtocolSource[]): void {
  sources = toIndexedSources(value);
}

export function getSources(client: ReplayClientInterface) {
  if (sources !== null) {
    return sources;
  }

  if (inProgressSourcesWakeable === null) {
    inProgressSourcesWakeable = createWakeable();

    // Suspense caches fire and forget; errors will be handled within the fetch function.
    fetchSources(client);
  }

  throw inProgressSourcesWakeable;
}

export function getSource(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId
): ProtocolSource | null {
  const sources = getSources(client);
  return sources.find(source => source.sourceId === sourceId) || null;
}

export function getSourceIfAlreadyLoaded(sourceId: ProtocolSourceId): ProtocolSource | null {
  if (sources !== null) {
    return sources.find(source => source.sourceId === sourceId) || null;
  }

  return null;
}

export function getSourceContents(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId
): ProtocolSourceContents {
  let record = sourceIdToSourceContentsMap.get(sourceId);
  if (record == null) {
    record = {
      status: STATUS_PENDING,
      value: createWakeable<ProtocolSourceContents>(),
    };

    sourceIdToSourceContentsMap.set(sourceId, record);

    // Suspense caches fire and forget; errors will be handled within the fetch function.
    fetchSourceContents(client, sourceId, record, record.value);
  }

  if (record!.status === STATUS_RESOLVED) {
    return record!.value;
  } else {
    throw record!.value;
  }
}

export function getCachedMinMaxSourceHitCounts(
  sourceId: ProtocolSourceId,
  focusRange: TimeStampedPointRange | PointRange | null
): MinMaxHitCountTuple | [null, null] {
  const pointRange = focusRange !== null ? toPointRange(focusRange) : null;

  let key = `${sourceId}`;
  if (pointRange !== null) {
    key = `${key}:${pointRange.begin}:${pointRange.end}`;
  }

  return sourceIdToMinMaxHitCountsMap.get(key) || [null, null];
}

export function getSourceHitCounts(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId,
  locationRange: SourceLocationRange,
  focusRange: TimeStampedPointRange | PointRange | null
): LineNumberToHitCountMap {
  // TODO We could optimize this in some cases to filter in memory.

  // Focus range is tracked as TimeStampedPointRange.
  // For convenience, this public API accepts either type.
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

  let key = `${sourceId}:${locationRange.start.line}:${locationRange.start.column}:${locationRange.end.line}:${locationRange.end.column}`;
  if (pointRange !== null) {
    key = `${key}:${pointRange.begin}:${pointRange.end}`;
  }

  let record = sourceIdToHitCountsMap.get(key);
  if (record == null) {
    record = {
      status: STATUS_PENDING,
      value: createWakeable<LineNumberToHitCountMap>(),
    };

    sourceIdToHitCountsMap.set(key, record);

    // Suspense caches fire and forget; errors will be handled within the fetch function.
    fetchSourceHitCounts(client, sourceId, locationRange, pointRange, record, record.value);
  }

  if (record!.status === STATUS_RESOLVED) {
    return record!.value;
  } else {
    throw record!.value;
  }
}

export const {
  getValueSuspense: getBreakpointPositionsSuspense,
  getValueAsync: getBreakpointPositionsAsync,
  getValueIfCached: getBreakpointPositionsIfCached,
} = createGenericCache<
  [replayClient: ReplayClientInterface, sourceId: ProtocolSourceId],
  ProtocolSameLineSourceLocations[]
>(
  (client, sourceId) => client.getBreakpointPositions(sourceId, null),
  (_, sourceId) => sourceId
);

async function fetchSources(client: ReplayClientInterface) {
  const protocolSources = await client.findSources();
  sources = toIndexedSources(protocolSources);

  inProgressSourcesWakeable!.resolve(sources!);
  inProgressSourcesWakeable = null;
}

async function fetchSourceContents(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId,
  record: Record<ProtocolSourceContents>,
  wakeable: Wakeable<ProtocolSourceContents>
) {
  try {
    const sourceContents = await client.getSourceContents(sourceId);

    record.status = STATUS_RESOLVED;
    record.value = sourceContents;

    wakeable.resolve(record.value);
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
  }
}

async function fetchSourceHitCounts(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId,
  locationRange: SourceLocationRange,
  focusRange: PointRange | null,
  record: Record<LineNumberToHitCountMap>,
  wakeable: Wakeable<LineNumberToHitCountMap>
) {
  try {
    const locations = await getBreakpointPositionsAsync(client, sourceId);
    const hitCounts = await client.getSourceHitCounts(
      sourceId,
      locationRange,
      locations,
      focusRange
    );

    {
      // Refine cached min-max hit count as we load more information about a source.
      // Because hit counts may be filtered by a range of lines, this value may change as new information is loaded in.
      const key =
        focusRange === null ? `${sourceId}` : `${sourceId}:${focusRange.begin}:${focusRange.end}`;
      let [minHitCount, maxHitCount] = sourceIdToMinMaxHitCountsMap.get(key) || [
        Number.MAX_SAFE_INTEGER,
        0,
      ];
      hitCounts.forEach(hitCount => {
        const { count } = hitCount;
        minHitCount = Math.min(minHitCount, count);
        maxHitCount = Math.max(maxHitCount, count);
      });
      sourceIdToMinMaxHitCountsMap.set(key, [minHitCount, maxHitCount]);
    }

    record.status = STATUS_RESOLVED;
    record.value = hitCounts;

    wakeable.resolve(record.value);
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
  }
}

export function isIndexedSource(source: ProtocolSource): source is IndexedSource {
  return source.hasOwnProperty("contentHashIndex");
}

export function getSourcesToDisplay(client: ReplayClientInterface): ProtocolSource[] {
  const sources = getSources(client);
  return sources.filter(source => source.kind !== "inlineScript");
}

function isPointRange(range: TimeStampedPointRange | PointRange): range is PointRange {
  return typeof range.begin === "string";
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

function toPointRange(range: TimeStampedPointRange | PointRange): PointRange {
  if (isPointRange(range)) {
    return range;
  } else {
    return {
      begin: range.begin.point,
      end: range.end.point,
    };
  }
}
