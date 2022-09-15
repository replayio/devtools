import {
  ContentType as ProtocolContentType,
  newSource as ProtocolSource,
  SameLineSourceLocations as ProtocolSameLineSourceLocations,
  SourceId as ProtocolSourceId,
  SourceLocation as ProtocolSourceLocation,
} from "@replayio/protocol";
import { LineHits, ReplayClientInterface } from "shared/client/types";

import { createWakeable } from "../utils/suspense";
import { createGenericCache } from "./createGenericCache";

import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";

export type ProtocolSourceContents = {
  contents: string;
  contentType: ProtocolContentType;
};

let inProgressSourcesWakeable: Wakeable<ProtocolSource[]> | null = null;
let sources: ProtocolSource[] | null = null;

type LineNumberToHitCountMap = Map<number, LineHits>;

const sourceIdToHitCountsMap: Map<ProtocolSourceId, Record<LineNumberToHitCountMap>> = new Map();

const sourceIdToSourceContentsMap: Map<
  ProtocolSourceId,
  Record<ProtocolSourceContents>
> = new Map();

export function preCacheSources(value: ProtocolSource[]): void {
  sources = value;
}

export function getSources(client: ReplayClientInterface) {
  if (sources !== null) {
    return sources;
  }

  if (inProgressSourcesWakeable === null) {
    inProgressSourcesWakeable = createWakeable();
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

    fetchSourceContents(client, sourceId, record, record.value);
  }

  if (record!.status === STATUS_RESOLVED) {
    return record!.value;
  } else {
    throw record!.value;
  }
}

export function getSourceHitCounts(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId
): LineNumberToHitCountMap {
  let record = sourceIdToHitCountsMap.get(sourceId);
  if (record == null) {
    record = {
      status: STATUS_PENDING,
      value: createWakeable<LineNumberToHitCountMap>(),
    };

    sourceIdToHitCountsMap.set(sourceId, record);

    fetchSourceHitCounts(client, sourceId, record, record.value);
  }

  if (record!.status === STATUS_RESOLVED) {
    return record!.value;
  } else {
    throw record!.value;
  }
}

export interface SourceLocationRange {
  start: ProtocolSourceLocation;
  end: ProtocolSourceLocation;
}

export const {
  getValueSuspense: getBreakpointPositionsSuspense,
  getValueAsync: getBreakpointPositionsAsync,
  getValueIfCached: getBreakpointPositionsIfCached,
} = createGenericCache<
  [ReplayClientInterface, ProtocolSourceId, SourceLocationRange?],
  ProtocolSameLineSourceLocations[]
>(
  (client, sourceId, range) => client.getBreakpointPositions(sourceId, range),
  (client, sourceId, range) =>
    range
      ? `${sourceId}:${range.start.line}:${range.start.column}:${range.end.line}:${range.end.column}`
      : sourceId
);

async function fetchSources(client: ReplayClientInterface) {
  sources = await client.findSources();

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
  record: Record<LineNumberToHitCountMap>,
  wakeable: Wakeable<LineNumberToHitCountMap>
) {
  try {
    const hitCounts = await client.getSourceHitCounts(sourceId);

    record.status = STATUS_RESOLVED;
    record.value = hitCounts;

    wakeable.resolve(record.value);
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
  }
}

export function getSourcesToDisplay(client: ReplayClientInterface): ProtocolSource[] {
  const sources = getSources(client);
  return sources.filter(source => source.kind !== "inlineScript");
}
