import {
  Location as ProtocolLocation,
  MappedLocation as ProtocolMappedLocation,
} from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";

import { Cache, createCache } from "suspense";

export const mappedLocationCache: Cache<
  [replayClient: ReplayClientInterface, location: ProtocolLocation],
  ProtocolMappedLocation
> = createCache({
  config: { immutable: true },
  debugLabel: "MappedLocationCache",
  getKey: ([client, location]) => `${location.sourceId}:${location.line}:${location.column}`,
  load: async ([client, location]) => client.getMappedLocation(location),
});
