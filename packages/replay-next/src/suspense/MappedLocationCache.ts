import {
  Location as ProtocolLocation,
  MappedLocation as ProtocolMappedLocation,
} from "@replayio/protocol";
import { createCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";

export const {
  getValueIfCached: getMappedLocationIfCached,
  read: getMappedLocationSuspense,
  readAsync: getMappedLocationAsync,
} = createCache<
  [location: ProtocolLocation, replayClient: ReplayClientInterface],
  ProtocolMappedLocation
>({
  debugLabel: "MappedLocationCache: getMappedLocation",
  getKey: location => `${location.sourceId}:${location.line}:${location.column}`,
  load: async (location, client) => client.getMappedLocation(location),
});
