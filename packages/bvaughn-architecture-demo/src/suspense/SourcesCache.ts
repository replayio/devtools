import { newSource as ProtocolSource, SourceId as ProtocolSourceId } from "@replayio/protocol";

import { ReplayClientInterface } from "../../../shared/client/types";

import { createWakeable } from "../utils/suspense";

import { Wakeable } from "./types";

let inProgressWakeable: Wakeable<ProtocolSource[]> | null = null;
let sources: ProtocolSource[] | null = null;

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

  if (inProgressWakeable === null) {
    inProgressWakeable = createWakeable();
    fetchSources(client);
  }

  throw inProgressWakeable;
}

async function fetchSources(client: ReplayClientInterface) {
  sources = await client.findSources();

  inProgressWakeable!.resolve(sources!);
  inProgressWakeable = null;
}
