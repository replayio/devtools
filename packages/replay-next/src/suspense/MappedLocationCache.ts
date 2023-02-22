import {
  Location as ProtocolLocation,
  MappedLocation as ProtocolMappedLocation,
} from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";

import { createGenericCache } from "./createGenericCache";

export const {
  getValueSuspense: getMappedLocationSuspense,
  getValueAsync: getMappedLocationAsync,
  getValueIfCached: getMappedLocationIfCached,
} = createGenericCache<
  [replayClient: ReplayClientInterface],
  [location: ProtocolLocation],
  ProtocolMappedLocation
>(
  "MappedLocationCache: getMappedLocation",
  (location, client) => client.getMappedLocation(location),
  location => `${location.sourceId}:${location.line}:${location.column}`
);
