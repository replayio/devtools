import {
  ContentType as ProtocolContentType,
  newSource as ProtocolSource,
  SourceId as ProtocolSourceId,
} from "@replayio/protocol";
import { ReplayClientInterface } from "shared/client/types";

import { createWakeable } from "../utils/suspense";

import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";

export type ProtocolSourceContents = {
  contents: string;
  contentType: ProtocolContentType;
};

let inProgressSourcesWakeable: Wakeable<ProtocolSource[]> | null = null;
let sources: ProtocolSource[] | null = null;

const sourceIdToSourceContentsMap: Map<
  ProtocolSourceId,
  Record<ProtocolSourceContents>
> = new Map();

export function preCacheSources(value: ProtocolSource[]): void {
  sources = value;
}

export function getSource(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId
): ProtocolSource | null {
  if (sources !== null) {
    return sources.find(source => source.sourceId === sourceId) || null;
  }

  if (inProgressSourcesWakeable === null) {
    inProgressSourcesWakeable = createWakeable();
    fetchSources(client);
  }

  throw inProgressSourcesWakeable;
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
